# Hands On

## Creating our ECS cluster

We now start to prepare a new stack for the todo service.
Add a new stack in a new file `lib/ecs-stack.ts` with the following code:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

interface EcsStackProps extends cdk.StackProps {
  vpc: Vpc;
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: EcsStackProps) {
    super(scope, id, props);

    const cluster = new Cluster(this, 'EcsCluster', {
      vpc: props?.vpc,
      enableFargateCapacityProviders: true,
    });
  }
}

```

As with the other stacks, make sure to import and add the new stack to the `bin/cdk.ts` file and pass the `vpc` property:

```typescript
// ...
import { EcsStack } from '../lib/ecs-stack';
// ...
const ecsStack = new EcsStack(app, 'EcsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
});
```

After that, deploy the changes with `cdk deploy --all`.


## Preparing the security groups

Open the ECS console and you'll see an empty ECS cluster running already.
Since it's a Fargate cluster, it doesn't cost anything, as we aren't running any tasks yet.

Now, we need to adjust the security group rule to allow access from the ECS-hosted todo-service.
We will be doing that by referencing the ECS task security group in the database security group. 
For that, we need both security groups in one Stack. It's better to set up the necessary security group rule in the EcsStack, 
since it's the one that depends on the database and not the other way around.

We could pass the whole database object to the ECS stack or just the security group. Both would work, but the former breaches the least-privilege principle.
Even better than the security group, we can pass the `Connections` property of the database cluster, which contains the security group of the database and provides some helper functions around it.

Similar to the `vpc` object from the VPC stack earlier, first expose the `Connections` object from the database stack to the ECS stack by making the following changes:

```typescript
export class DatabaseStack extends cdk.Stack {
  public dbCredentialsSecret: ISecret;
  public databaseConnections: IConnectable;

  constructor(scope: Construct, id: string, props?: DatabaseStackProps) {
    super(scope, id, props);

    // ...

    this.dbCredentialsSecret = dbCluster.secret!;
    this.databaseConnections = dbCluster.connections;
  }
}
```

Remember the necessary imports.
Then, add the `databaseConnections` to the props of the EcsStack in the `lib/ecs-stack.ts` file:

```typescript
// ...
import { IConnectable, Vpc } from 'aws-cdk-lib/aws-ec2';
// ...
interface EcsStackProps extends cdk.StackProps {
  vpc: Vpc;
  databaseConnections: IConnectable;
}
```

Finally, pass the `databaseConnections` from the Database stack to the ECS stack in the `bin/cdk.ts` file:

```typescript
const ecsStack = new EcsStack(app, "EcsStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "eu-central-1" },
  vpc: vpcStack.vpc,
  databaseConnections: databaseStack.databaseConnections,
});
```

Alright, the `Connections` object is now being passed to the ECS stack. We'll work with it in the next step.
Wait for the DatabaseStack deletion to complete and then deploy all changes with `cdk deploy --all`.


## Connect the Todo Service with the Database on AWS

Before we can deploy the todo-service, we need to configure the connection details for the database on AWS.
So we need to update the database configuration in the `todo-service/database.ts` file.

Replace the values in the `todo-service/database.ts` file with the values you can find in the Secret Manager Console in your browser.
There's a button "Retrieve secret value" at the side when you are in the secret's detail view.

```typescript
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "YOUR_CLUSTER_NAME.eu-central-1.rds.amazonaws.com", // Replace me as necessary
  port: 5432, // Replace me as necessary
  username: "YOUR_USERNAME", // Replace me as necessary
  password: "YOUR_PASSWORD", // Replace me as necessary
  database: "postgres", // Replace me as necessary
  synchronize: true, // Auto creates tables, disable in production
  logging: false,
  entities: [Todo],
});
```


## Deploying the todo-service to ECS

Now, the only thing that's still missing is the todo-service itself.
Add the following lines to the ECS Stack constructor in the `lib/ecs-stack.ts` file, right after the `cluster` variable definition:

```typescript
const albFargateService = new ApplicationLoadBalancedFargateService(
  this,
  'TodoService',
  {
    cluster,
    cpu: 512,
    memoryLimitMiB: 1024,
    desiredCount: 1,
    taskImageOptions: {
      image: ContainerImage.fromAsset('../todo-service', {
        platform: Platform.LINUX_AMD64,
        exclude: ['node_modules', 'cdk.out'],
      }),
      containerPort: 3000,
      logDriver: new AwsLogDriver({
        streamPrefix: 'ecs/todo-service',
      }),
    },
    taskSubnets: {
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    },
    propagateTags: PropagatedTagSource.SERVICE,
  }
);

albFargateService.service.connections.allowToDefaultPort(
  props!.databaseConnections
);
```

Necessary imports can be found in `aws-cdk-lib/aws-ec2`, `aws-cdk-lib/aws-ecr-assets`, `aws-cdk-lib/aws-ecs`, and `aws-cdk-lib/aws-ecs-patterns`.

It's the most complex object we've used so far. So let's break it down:

- `cluster` is the ECS cluster we created earlier. Normally, it'd be `cluster: cluster`, but when both sides have the same name in TypeScript, we can shorten it.
- `cpu` is _not_ the amount of CPU cores, but rather a CPU unit value where 1024 units = 1 vCPU. These units are sometimes also called "millicores".
  More insights can be found in the [AWS docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedFargateService.html#cpu).
- `memoryLimitMiB` is the maximum amount of memory in MiB that the ECS-task is allowed to use. It is also what you'll pay for. Check the link on `cpu` about allowed combinations of `cpu` and `memoryLimitMiB`.
- `taskImageOptions` is the configuration for the container image.
  - `image` is the container image we want to use. In this case, we run the `docker build` command from the specified path, while excluding the `node_modules` folder.
    Make sure this fits your folder structure.
  - `containerPort` is the port on which the container is listening for traffic.
  - `logDriver` is optional, but necessary if we want to set the log retention time - default is forever.
    - `streamPrefix` is the prefix for the log group.
- `taskSubnets` is the subnet in which the task is placed.
  - `subnetType` is the type of subnet. Here, we don't make the todo-service public, so it's placed in a private subnet. The `WITH_EGRESS` referes to outgoing internet access. Depending on your application, that might or might not be necessary.
- `propagateTags` tells AWS to propagate the tags from the service to its tasks. Otherwise, the tasks would have no tags. Although not necessary here, it's a good practice to set it to `PropagatedTagSource.SERVICE`.

The `allowDefaultPortFrom` function in the last line of the codeblock refers to our security groups: We allow (the security group of) the todo-service to access the database (security group) on the database's default port (5432). Isn't that magical?! No need to care about IP ranges, security group names, ports, etc.

Deploy the changes now. If you run into issues, please consult the next section below.

You can follow the deployment along in the CloudFormation console and the ECS console.
During/After the deployment, also check the status and logs of the todo-service.


## Troubleshooting

The object is complex, and it's easy to make a mistake. Also, cross-platform compatibility issues can be additional pain. Here are some common issues:

If you get an error that says something like `Cannot find image directory`, make sure you set the `image` property correctly. It needs to point to the directory containing the `Dockerfile`.

If you get an error that says something like `400 Bad Request` and you're using Docker Desktop, make sure you set the cross-platform parameters correctly, disable containerd in Docker Engine, and delete any existing images in the ECR repository.

If you the deployment takes >10 minutes, check the ECS console about failed tasks and their logs.
Should you see a status message that says `Essential container in task exited`, it means there was an application error.
If you find a log message that says `Database connection failed`, make sure to check the credentials against the secret manager.

By default, CloudFormation will timeout and fail after 1 hour. If you identified an issue, and want to redeploy earlier, you can manually cancel the stack update. For fresh/new stacks that are being deployed for the first time, there is no such option. Delete the whole stack instead.

If everything went well, the todo-service should now print the very relieving message `Database connected!` to the logs.
Nice work!


## About that `ApplicationLoadBalancedFargateService`

You might have noticed that we deployed an `ApplicationLoadBalancedFargateService` instead of a `FargateService`.
This small difference automagically created a loadbalancer for us - in a public subnet.
Yes, you read right - no further configuration needed.
Open the EC2 console now and check out that new shiny loadbalancer.

But wait, isn't there a DNS entry in the loadbalancer? Go check it out in your browser (http only ;) ).
Yay! Our service is already accessible from the outside!

When did that happen?
If you go into the loadbalancer's Listeners and Rules section, you'll find a listener for port 80 and a rule that forwards all traffic to the target group.
If you then click onto that rule, you'll find there's only a default one, which forwards traffic to a target group.
And the target group contains a single entry, which is listens on port 3000 - our ECS-task.

That's the magic of the `ApplicationLoadBalancedFargateService`!


## Health Checks

Still on the target group, you can find a tab called `Health checks`.
At the moment, it's configured to make a health check every 30 seconds, it requires a 200 response from the targets traffic port (3000) and 5 consecutive successful health checks before a task is considered healthy. And it will reach out to `/` on the todo-service.

In most cases, `/` will return more than just our `Hello World` message, so it's impractial to use it for health checks.
It's common practice to create a dedicated health check route, like `/health`, which returns a simple `ok` message.
Keep in mind, that the endpoint should only check the health of the application, not of any dependencies. Else, when a dependency is down, the application cannot be deployed any more.

Add the following line to the `todo-service/src/routes/todoRoutes.ts` file:

```typescript
router.get("/health", (req, res) => {
  res.send("ok");
});
```

In the `/cdk/lib/ecs-stack.ts` file, add the following lines to the constructor of the `EcsStack` class, for example after the `allowToDefaultPort` line:

```typescript
albFargateService.targetGroup.configureHealthCheck({
  path: '/health',
});
```

With the parameters of this method, you can configure other parameters here, too. Like decreasing the healthy-threshold from 5 to 3, or the default timeout from 5 seconds to 1 second.

Deploy the new configuration now.

Verify your settings in the target group's health check section. You can find this in the target group's description in the EC2 console.


## Architecture diagram

Here's an architecture diagram of the resulting setup:

![Architecture diagram](../../media/architecture.drawio.svg)

In this diagram, you can see the VPC, the subnets, the loadbalancer, the ECS cluster, the ECS task, and the RDS database.

Sidenote:
Keep in mind that the ECS task only runs in one AZ at the moment, as we only have one instance so far. Although it's undefined which one that is, therefore it's pictured in all AZs in the diagram.
For the Database it's similar, but it's one managed cluster running in all AZs, so it's a box across all AZs, but a single icon.
