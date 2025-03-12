# Hands On

An alternative to the compute platform ECS are Lambdas. A Lambda function is similar to an ECS-service in that it's a managed service that runs application code. Yet, it's different in that it's not a continuously running container, but only a single function that processes a single event.
That means, for every incoming event, there's a new Lambda invocation.

First, let's look at how the cdk code for a lambda function looks like.
Create a new file `lib/lambda-stack.FileProcessingLambda.ts` and add the following sample lambda function code:

```typescript
export async function handler() {
  const response = 'hello-world';
  console.log(response);
  return {
    body: response,
    statusCode: 200,
  };
}
```

As you can see, it's a very simple async function that returns a body and a status code.

To install proper type-handling, run `npm install -D @types/aws-lambda` (`-D` == `--save-dev`) in the cdk project to add the types for the lambda function.

To deploy this lambda function, we need to create a new stack.
Create a new file `lib/lambda-stack.ts` and add the following code:

```typescript
import * as cdk from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  vpc: IVpc;
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props);

    const fileProcessingLambda = new NodejsFunction(
      this,
      'FileProcessingLambda',
      {
        runtime: Runtime.NODEJS_22_X,
        vpc: props!.vpc,
      }
    );
  }
}
```

As you can see, creating a Lambda function is very easy. The only requirement is to tell AWS which runtime to use. In this case, we're also passing the VPC to the Lambda function, so it can access the resources in our VPC.

The filepath where the lambda code is located is by default derived from the name of the defining file and the construct's id.
For example, if the `NodejsFunction` is defined in a file named `lambda-stack.ts` with `FileProcessingLambda` as construct id (`new NodejsFunction(this, 'FileProcessingLambda')`), then cdk will look for `lambda-stack.FileProcessingLambda.ts` and `lambda-stack.FileProcessingLambda.js` files for the lambda function code.

You might've been wondering, why there weren't any cpu or memory values defined.
Compared to ECS, the resource configuration for Lambdas is slightly different.
You can only configure memory with a value between 128 MB and 10,240 MB in 1-MB increments. The assigned vCPU increases proportionally and cannot be set directly.

As per [AWS docs](https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html), at 1.769 MB, a function has the equivalent of one vCPU (one vCPU-second of credits per second).
The default `memorySize` for Lambdas is 128 MB, which is both the minimum and sufficient for our use case, so we can skip the parameter.

After creating the stack definition, we need to add the new `lambdaStack` to the `bin/cdk.ts` file (for example after the `EcsStack`):

```typescript
// ...
import { LambdaStack } from "../lib/lambda-stack";
// ...
const lambdaStack = new LambdaStack(app, "LambdaStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "eu-central-1" },
  vpc: vpcStack.vpc,
});
```

Deploy the new stack.
If you want, you can choose to deploy only this stack with `cdk deploy LambdaStack`. Since all other changes have been deployed already, this can speed up things a bit.

Go to the Lambda console in your browser and explore the new function you deployed. On the `Test` tab, hit the `Test` button - no need to change any parameters beforehand.
Expand the details in the green info box that appears, and check the response and the logs.

Then, change the code of the lambda function to log the full message body like this:

```typescript
import { SQSEvent, SQSRecord } from 'aws-lambda';

export const handler = async (event: SQSEvent) => {
  const records: SQSRecord[] = event.Records;

  for (let index = 0; index < records.length; index++) {
    const body = records[index].body;
    console.log(body);
  }

  return;
};
```

Again, deploy the changes (`cdk deploy LambdaStack` is fastest) and test the lambda function again.

The log messages will say something about a TypeError and not being able to read something.
This is because the lambda function expects a SQS-event instead of our manually created event.
You can find an example of how such an event can look like here: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#example-standard-queue-message-event

It might look complex at first, but for this workshop, only the following points are important to know:

- An SQS-event is still JSON
- The JSON contains a list of records
- Each record contains a `body` element
- The `body` element contains the actual message

Now compare this new knowledge against the code of the lambda function. Can you guess what it'll do?


## SQS

Instead of manually testing the lambda function with a custom event, we should trigger it by an automated event.
These events can generally come from a lot of different sources like S3, CloudWatch, or SQS. Especially SQS is a very common source to trigger Lambdas.
You can find a full list of event sources for Lambda functions here: https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html

SQS stands for Simple Queue Service. It's a message queue service that - together with a computing service like Lambda - allows you to decouple the processing of requests from the request itself.
Check out the SQS console in your browser and manually create a queue with default settings.
Send a message to the queue manually from the SQS console, with a random JSON body like the following:

```json
{
  "id": 1,
  "name": "John Doe"
}
```

Then poll the queue to see how the message looks like.

When a consumer processes a message from the queue, it "marks it" as being processed.
If it doesn't acknowledge the successful processing in time, for example because it failed, the message will be put into the queue again.

In case a message itself is invalid so the service won't be able to process it no matter how often it tries, there's a feature called "dead letter queue" (DLQ) that can be used to move the message to a different queue.
Instead of setting up everything manually, we want to leverage CDK again. Remove the manually created queue and move back to our CDK codebase.

Create a new stack file `lib/sqs-stack.ts` and add the following code:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class SqsStack extends cdk.Stack {
  public queue: Queue;
  public dlq: Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dlq = new Queue(this, 'Dlq', {
      queueName: 'dlq',
    });
    this.dlq = dlq;

    const queue = new Queue(this, 'Queue', {
      queueName: 'queue',
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });
    this.queue = queue;
  }
}
```

This will create a queue with a dead letter queue.
Messages will be automatically put to this dlq after they were failed to be processed 3 times.
Both queues are then exposed by the stack.

Add the new stack to the `bin/cdk.ts` file, before the `LambdaStack` and before the `EcsStack`.
Since SQS is a fully managed service, it's not necessary to pass the VPC to the stack this time.
That means, that traffic to SQS is not routed through the VPC, but directly to the SQS service endpoint. By default, this endpoint is public, so the traffic is routed through the public internet.

Since, it's using HTTPS, that's not necessarily a problem.
If you don't want that - as you pay for outgoing traffic for example - you can create a private endpoint for SQS in your VPC. We won't cover that in this workshop, though.

Make the queue available in the LambdaStack, by passing the `queue` and `dlq` objects from the SqsStack to it.
You've seen how to set up StackProps a few times now already, so try to do it on your own this time.

For types, both `Queue` and `IQueue` are possible and valid. A better practice is to use `IQueue` for parameters, since it can be mocked in tests.
In the scope of this workshop, either is fine.

Then adjust the code for the lambda function for both queues, by adjusting the code in the `lib/lambda-stack.ts` file as follows:

```typescript
// ...
const fileProcessingLambda = new NodejsFunction(this, 'FileProcessingLambda', {
  runtime: Runtime.NODEJS_22_X,
  vpc: props!.vpc,
  deadLetterQueue: props!.dlq,
});

fileProcessingLambda.addEventSource(new SqsEventSource(props!.queue));
// ...
```

Deploy the changes.

Did you notice how cdk automatically asked you to approve the IAM permission changes necessary for the lambda function to access the queue?

Open the queue in the SQS console again. Manually send a message to the queue as you did before.

Then check the logs of the lambda function. Is everything as you expected?


## Message handling

At the moment, the event messages were created manually by us.
Next, let's extend our ECS-task to trigger the lambda function with an event message whenever a new todo entry is created.

To work with AWS services from our todo-service application code, we need to install the `aws-cdk` in the `todo-service` project.
Run `npm install @aws-sdk/client-sqs` in the `todo-service` folder to add this new dependency.

Then, open the `todo-service/src/controllers/todoController.ts` file and add the following code to the `createTodo` method after the first try-catch block:

```typescript
// ...
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
// ...
try {
  // ...
} catch (error) {
  res.status(500).json({ error: 'Failed to create todo', details: error });
}

try {
  const queueUrl = process.env.QUEUE_URL;
  if (!queueUrl) {
    throw new Error('QUEUE_URL is not set');
  }
  const sqs = new SQSClient();
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({
      title,
      description,
      dueDate,
      status,
      userEmail,
    }),
  });
  await sqs.send(command);
} catch (error) {
  console.error('Failed to send message to queue', error);
}
// ...
```

The above code will send a message to the queue whenever a new todo was successfully created.
The queue url is picked up from the environment variables.
Which means we need to add it to the environment variables of the ECS-service in the cdk codebase.

Open the `lib/ecs-stack.ts` file and extend the environment variables of the `ApplicationLoadBalancedFargateService` like this:

```typescript
// ...
import { IQueue } from 'aws-cdk-lib/aws-sqs';
// ...
interface EcsStackProps extends cdk.StackProps {
  // ...
  queue: IQueue;
}
// ...
environment: {
  ELASTICACHE_ENDPOINT: props!.elasticacheEndpoint,
  QUEUE_URL: props!.queue.queueUrl,
},
// ...
```

Also, we need to add the parameter to the `bin/cdk.ts` file and add the new dependency:

```typescript
// ...
const ecsStack = new EcsStack(app, 'EcsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
  databaseCluster: databaseStack.databaseCluster,
  elasticacheEndpoint: elasticacheStack.endpointAddress,
  elasticacheConnections: elasticacheStack.connections,
  queue: sqsStack.queue,
});
// ...
```

Deploy these changes now.


## Troubleshooting

Create a new todo via the application api and check whether

- the lambda function printed any logs
- the SQS queue and DLQ are empty
- the ECS-task printed any logs

Whoops, we forgot to allow the ECS-service to send messages to the queue.
Because the default SQS endpoint is public, we - and AWS - need to make sure we are actually allowed to access our specific queue.

Extend the `lib/ecs-stack.ts` file - for example right after the blocks with `service.connections` - to add the necessary permissions:

```typescript
// ...
const albFargateService = new ApplicationLoadBalancedFargateService(this, 'TaskService', {
  // ...
  props!.queue.grantSendMessages(albFargateService.service.taskDefinition.taskRole);
  // ...
});
// ...
```

Deploy the changes once again.

Create a new todo via the application api and follow along in the logs like before.

Alright, this time the lambda gets the right information. Although, it doesn't do anything with it, except logging it.

Congratulations, you just

- created an SQS queue to decouple the ECS-service from the lambda function
- made the ECS-service send messages to the SQS queue
- created a lambda function that processes messages from the SQS queue
- made the SQS queue trigger a lambda function
- created a dead letter queue for the SQS queue to handle invalid messages
