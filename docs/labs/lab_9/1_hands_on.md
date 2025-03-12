# Hands On

There are different areas where we can apply caching in our lab setup.

## Caching the Docker Image

What you might have noticed during your previous deployments, is that the docker image is always rebuilt and redeployed, even if there was no change in the code for it.
You can fix that by caching the docker image locally by adding a single line to the `lib/ecs-stack.ts` file:

```typescript
image: ContainerImage.fromAsset(
  "../todo-service",
  {
    platform: Platform.LINUX_AMD64,
    exclude: ["node_modules"],
    outputs: ['type=docker'], // this is the magic line
  }
),
```

It tells cdk to not just build and push to AWS, but also to output the docker image to the local docker daemon.

Note that this doesn't work for pipelines like Github Actions. But there are other ways to cache the docker image there as well; but they are not covered by this workshop.

In our `todo-service/Dockerfile`, you currently have the line `FROM node:22-alpine`. This means, you're pulling the node image from the docker hub.
Docker hub is known for its rather harsh rate limiting, so it's a better practice to use the AWS public gallery for common images like node.
Practice searching for them by trying to find the right url for the node image from the AWS ECR public gallery on your own.

Solution: Change the `FROM` line in the `Dockerfile` to `FROM public.ecr.aws/docker/library/node:22-alpine`.
If you are curious why we choose `-alpine` instead of any other variant, you can read a good comparison about the differences here: https://labs.iximiuz.com/tutorials/how-to-choose-nodejs-container-image.
TL;DR: The alpine image is way smaller and therefore faster to download and start.


## Caching with Redis

While that was somewhat related to caching, this wasn't our primary goal in this caching section.
There are a lot of occasions where you can cache something when working with AWS. Common ones are your own CDN for websites via CloudFront, said docker images in a deployment pipeline, or key-value stores like Redis to decrease the load on your database.

While most applications can just cache requests in their own memory, there are use cases where you want or need to share the cache between multiple instances.
That's where a managed cache like Redis comes in.

In AWS, there's a managed service for Redis called "ElastiCache" that supports running a managed Redis instance or cluster.
There are two modes supported, which have [very different pricing](https://aws.amazon.com/elasticache/pricing/):

- serverless, where you pay per GB-hour and data transfer.
- instance-based, where you pay per instance and are only limited memory.

Both are managed services, so neither are a lot of effort to maintain. In this case, it really depends on your use case.
- Do you have constant traffic and know how much memory you need? You'll probably save money by using the instance-based mode.
- Do you have highly dynamic traffic, and don't know how much memory you need? You'll probably save money by using the serverless mode.

The serverless one is a bit easier to set up, so we'll use that in this workshop.

So far, we've only used L2 constructs in our CDK code.
For ElastiCache, there are only L1 constructs available, which means a bit more code is required to set it up.

Since it's a new dependency of our todo-service, we'll add the ElastiCache in a separate stack.
Create a new file `lib/elasticache-stack.ts` and add the following code:

```typescript
import * as cdk from 'aws-cdk-lib';
import { aws_elasticache as ElastiCache } from 'aws-cdk-lib';
import { IVpc, Port, SecurityGroup, IConnectable, Connections } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface ElasticacheStackProps extends cdk.StackProps {
  vpc: IVpc;
}

export class ElasticacheStack extends cdk.Stack {
  public endpointAddress: string;
  public connections: IConnectable;

  constructor(scope: Construct, id: string, props?: ElasticacheStackProps) {
    super(scope, id, props);

    const securityGroup = new SecurityGroup(this, 'ElastiCacheSecurityGroup', {
      vpc: props!.vpc,
      allowAllOutbound: true,
    });

    this.connections = new Connections({
      defaultPort: Port.tcp(6379),
      securityGroups: [securityGroup],
    });

    const elasticache = new ElastiCache.CfnServerlessCache(
      this,
      'ServerlessCache',
      {
        engine: 'redis',
        serverlessCacheName: 'todo-service-cache',
        securityGroupIds: [securityGroup.securityGroupId],
        subnetIds: props!.vpc.privateSubnets.map((s) => s.subnetId),
      }
    );

    this.endpointAddress = elasticache.attrEndpointAddress;
  }
}
```

This code creates an ElastiCache stack that sets up a serverless Redis instance. Let's break down the key components:

- The stack takes a VPC as input through the `ElasticacheStackProps` interface, since ElastiCache needs to be deployed into a VPC.

- A security group is created before the ElastiCache instance so it can be passed into its declaration.

- A `Connections` object is created and exposed by this stack. This object bundles the security group with the default Redis port (6379) to make it easier to grant access to other AWS resources.

- The main ElastiCache instance is created using `CfnServerlessCache`:
  - Uses Redis as the engine
  - Named 'todo-service-cache'
  - Placed in the private subnets of the provided VPC
  - Associated with the security group we created

- The endpoint address is also exposed by this stack. It contains the hostname that applications will use to connect to Redis.

The stack exposes both the endpoint address and connections object so that other stacks (like our ECS service) can connect to and use the Redis cache.

Make sure to add the new stack to the `bin/cdk.ts` file - before the `ecsStack` declaration - exactly like we did for the database stack.

Then, deploy the changes.

Redis doesn't have authentication enabled by default. In our case this is fine, but in production you should always enable authentication.
For us, it means we can skip setting up secrets.
Instead, we have an endpoint address and a connection object to pass to the ecs-stack.

Similar to the `databaseConnections` object, we'll add an `elasticacheConnections` variable and an `elasticacheEndpoint` variable to the `EcsStackProps` interface in the `lib/ecs-stack.ts` file:

```typescript
interface EcsStackProps extends cdk.StackProps {
  vpc: Vpc;
  databaseConnections: Connections;
  databaseCredentialsSecret: ISecret;
  elasticacheConnections: IConnectable;
  elasticacheEndpoint: string;
}
```

Which of course also means, we'll need to pass these variables from one stack to the other in the `bin/cdk.ts` file.

Next, add an `environment` section to the `ApplicationLoadBalancedFargateService` in the `lib/ecs-stack.ts` file that has the endpoint as value:

```typescript
const albFargateService = new ApplicationLoadBalancedFargateService(
  this,
  "TodoService",
  {
    // ...
    taskImageOptions: {
      // ...
      environment: {
        REDIS_ENDPOINT: props!.elasticacheEndpoint,
      },
    },
    // ...
  }
);
```

Lastly, add another line next to the `allowToDefaultPort` line to allow the ECS-tasks to connect to the elasticache instance:

```typescript
albFargateService.service.connections.allowToDefaultPort(
  props!.elasticacheConnections
);
```

According to the [docs](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/set-up.html#elasticache-install-grant-access-VPN), for serverless redis, we need to allow a second port, which is 6380:

```typescript
albFargateService.service.connections.allowTo(
  props!.elasticacheConnections,
  Port.tcp(6380) // imported from aws-cdk-lib/aws-ec2
);
```


That's it for the infrastructure part. Next, we need to add a feature to our todo-service so it starts using the new shiny cache.

First, run `npm i redis --save` to add the redis dependency to the application project.
Then, add the following configuration to the `todo-service/src/database.ts` file:

```typescript
export const AppDataSource = new DataSource({
  // ...
  cache: {
    type: "redis",
    options: {
      socket: {
        host: process.env.REDIS_ENDPOINT,
        tls: process.env.REDIS_ENDPOINT !== "redis", // Disable TLS for local development
        connectTimeout: 100, // 100ms
      },
    },
  },
});
```

This additional configuration is enough to add the redis cache to our application.
The condition on the tls property ensures we don't run into issues when running the application locally where we can't validate public DNS names.

Deploy these changes now.

While Redis is being deployed, we'll work on a local setup to reflect the changes we've made.

Adjust the `docker-compose.yml` file to include the redis service:

```yaml
services:
  postgres: # ...

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

  todo-service:
    # ...
    depends_on:
      - postgres
      - redis
    # ...
```

And add the `REDIS_ENDPOINT` to the `.env` file:

```sh
# ...
REDIS_ENDPOINT=redis
```

Verify that the application is working locally with our new changes.

When the AWS deployment is finished, run another k6 load test with a duration of 1m and a target of 10000, and also include the thresholds again. When evaluating the results, make sure to check the load of elasticache.

Do you know why we still run into the limits from earlier?

Solution: The app doesn't scale fast enough for our load test.
That's why in proper load testing scenarios you ramp up the load way more slowly.

If you want, you can try another load test with a duration of 20 minutes and a target of 10000. Make sure to enable the thresholds again.
Or read on about what happens if you do:

For me, a third instance started roughly 10 minutes into the test.

You can check the cpu metrics of the service, the number of parallel ECS-tasks that are running or the "Events" tab of the ECS-service to see how the scaling event looks like.
<!-- 
The following was related to an ongoing ECS deployment, which wanted to replace tasks - it looks like AWS ensure the healthchecks come in first.

Roughly 15 minutes into the test, something weird happened;

I saw timeouts happening in the k6 output, and the ECS Console showed only one task was running. The others were deprovisioning.
Shortly after, the load test stopped, as it seemed to have found the limit.

After investigating this, by checking one of the deprovisioning tasks, you'll find out, that the tasks healthchecks failed.

Why does this make sense? When the todo-service begins to be unresponsive due to overload, the healthcheck will fail and the task will be replaced.
So the tasks weren't scaled down, but replaced because they were deemed unhealthy.

Learnings from this:
- The load test still scaled too fast compared to the elasticache instance.
- The healthcheck should have priority over request handling.

Fixing either is a lengthy process, so we'll ignore these issues for now.
-->
