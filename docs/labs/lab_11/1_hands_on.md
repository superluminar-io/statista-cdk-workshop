# Hands On

## Managing ECR Outside of CDK (with Tag Versioning)

Previously, CDK used `fromAsset()` to build and publish Docker images behind the scenes. This time, you’ll take full control by:

* Creating a dedicated ECR repository
* Building and tagging the image manually
* Passing the image tag (e.g. Git commit SHA) into CDK
* Deploying the ECS service using that specific image

This is useful for production-grade CI/CD pipelines where version tracking and rollbacks are critical.

## Step 1 – Create a Dedicated ECR Repository

Create a new file `lib/ecr-stack.ts`:

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends cdk.Stack {
  public readonly todoServiceRepo: Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.todoServiceRepo = new Repository(this, 'TodoServiceRepo', {
      repositoryName: 'todo-service',
      imageTagMutability: TagMutability.MUTABLE,
    });
  }
}
```

Then register the stack in `bin/cdk.ts`:

```ts
import { EcrStack } from '../lib/ecr-stack';

const ecrStack = new EcrStack(app, 'EcrStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});
```

Deploy it:

```sh
cdk deploy --all
```


## Step 2 – Build and Push the Image (with Tag)

Choose a meaningful tag, for example your current Git commit:

```sh
export IMAGE_TAG=$(git rev-parse --short HEAD)
```

Authenticate to ECR:

```sh
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-central-1.amazonaws.com
```

Build, tag, and push the image:

```sh
docker build -t todo-service --platform linux/amd64 .
docker tag todo-service:latest <account-id>.dkr.ecr.eu-central-1.amazonaws.com/todo-service:$IMAGE_TAG
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/todo-service:$IMAGE_TAG
```


## Step 3 – Reference the Versioned Image from CDK

Update `lib/ecs-stack.ts` to take the `todoServiceRepo` and `imageTag` as a parameter and use it:

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cluster, ContainerImage, ApplicationLoadBalancedFargateService, AwsLogDriver } from 'aws-cdk-lib/aws-ecs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
// other necessary imports...

interface EcsStackProps extends cdk.StackProps {
  vpc: Vpc;
  databaseConnections: IConnectable;
  databaseCredentialsSecret: ISecret;
  todoServiceRepo: Repository;
  imageTag: string;
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const cluster = new Cluster(this, 'EcsCluster', {
      vpc: props.vpc,
      enableFargateCapacityProviders: true,
    });

    const albFargateService = new ApplicationLoadBalancedFargateService(this, 'TodoService', {
      cluster,
      taskImageOptions: {
        image: ContainerImage.fromEcrRepository(props.todoServiceRepo, props.imageTag),
        containerPort: 3000,
        logDriver: new AwsLogDriver({ streamPrefix: 'ecs/todo-service' }),
        secrets: {
          // your secret mapping
        },
      },
      taskSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      propagateTags: PropagatedTagSource.SERVICE,
    });

    albFargateService.service.connections.allowToDefaultPort(props.databaseConnections);
  }
}
```

Update your `bin/cdk.ts` to pass the repository:

```ts
const imageTag = app.node.tryGetContext('imageTag');
if (!imageTag) {
  throw new Error('Please provide the image tag using --context imageTag=<tag>');
}

const ecsStack = new EcsStack(app, 'EcsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
  databaseConnections: databaseStack.databaseConnections,
  databaseCredentialsSecret: databaseStack.dbCredentialsSecret,
  todoServiceRepo: ecrStack.todoServiceRepo,
  imageTag: imageTag,
});
```

Now deploy the changes passing the image tag into CDK as a context variable:

```sh
cdk deploy --context imageTag=$IMAGE_TAG
```

If you take a closer look at the changes that are about to be deployed, you’ll see that CDK is adjusting the permissions 
for pulling the image from ECR to the ECS task role automatically.

## Summary

You’ve now learned how to:

* Create and manage your own ECR repository
* Use a version tag (like a Git commit) to track images
* Pass versioning information into CDK at deployment time
* Decouple image publishing from infrastructure deployment

This approach makes your infrastructure CI/CD ready, version-controlled, and suitable for multi-environment workflows
where you create a container image once and deploy it to multiple environments.
