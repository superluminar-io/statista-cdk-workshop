# Hands On

At the moment, you'll get the invalid messages in the body of the notification email.

This is prone to get out of hand quickly. Also, the message is not very easily readable in the email format.

The logs aren't a better place, as you need to actively look for them, and they might be deleted at some point.

Therefore, it's better to store the invalid message for later manual handling, while only notifying the administrator (us) that something failed.
S3 buckets are very convienient for this use case, as S3 is in essence a network file share that can handle concurrent reads and writes out of the box.


## Create a S3 bucket & set permissions

For the S3 bucket, we'll add a new stack.
At this point, we've created several stack already - try to do it on your own this time.

Some guidance:

- Name the file `lib/s3-stack.ts`, and name the stack `S3Stack`.
- The code to create an S3 bucket in CDK is as follows:

  ```typescript
  // ...
  public bucket: Bucket;
  // ...
  this.bucket = new Bucket(this, 'Bucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
  });
  // ...
  ```
- Reference the new S3Stack in the `bin/cdk.ts` file.
- Add a parameter `bucket` (type `IBucket`) to the LambdaStackProps of the LambdaStack.
- Pass the exposed bucket object from the S3Stack to the LambdaStack by adjusting the `bin/cdk.ts`.
- Add the bucket name (`bucket.bucketName`) as environment variable to the dlqLambda, next to the SNS topic ARN.
- Grant the dlqLambda permissions to write files to the s3 bucket. The method is called `grantPut` and works similar to `grantPublish` for SNS topics.

Now, the dlqLambda can work with the S3 bucket.


## Store "dead letters" in S3 bucket

Since we need some kind of filename in to store files in an S3 buckets, let's create one by combining the dueDate and title of the todo.
This means, we need to parse the body first.

- The `Todo` interface already exists in the `FileProcessingLambda`, so you can copy it from there.

- Parsing in typescript is as simple as `const todo: Todo = JSON.parse(body);`.

- For the lambda to work with S3, you need to install the npm package `@aws-sdk/client-s3` in the cdk project.

- To write a file to S3, a bit of code is required. Try to derive it from the [docs](https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-s3) on your own.

If you get stuck or are finished, verify against the following code snippets:

```typescript
// ...
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// ...
const todo: Todo = JSON.parse(body);
const todoId: string = todo.dueDate + "-" + todo.title;

const params = {
  Bucket: process.env.BUCKET,
  Key: todoId+'.json',
  Body: JSON.stringify(todo),
};

const client = new S3Client();
const command = new PutObjectCommand(params);
try {
  const data = await client.send(command);
  console.log('todo saved to s3: ' + todoId);
  console.log(data);
} catch (error) {
  console.log('failed to save invalid todo to s3: ' + error);
}
// ...
```

At this point, the interaction with S3 should already be working. Feel free to verify, or complete the next section about the SNS adjustment first.


## Adjust SNS message to only contain task id

Instead of sending the full `body` object in the SNS `PublishCommand` options, adjust it so it only contains the S3 filename containing the full body and a helpful message along with it.

For example:

```typescript
Message: 'The Todo with the following ID couldn\'t be processed: ' + todoId,
```

Verify the results by creating some more todos with different dates.
Check the S3 console to find the saved file, download it and check its contents.


## One last thing

You might have noticed that Lambdas regularly create new log groups, and that these log groups have no retention time set.
That means, at the moment we're saving the logs of all executions of any of our lambdas - forever.

Identify the missing property for the two `NodejsFunction`s from the [docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunction.html#class-nodejsfunction-construct), and set it to one month. Hint: There's a class called `RetentionDays` in `aws-cdk-lib/aws-logs` - and we used it previously already.

Check in the CloudWatch Console in your browser whether the property was set correctly on the LogGroups.
