import { SQSEvent, SQSRecord } from 'aws-lambda';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

interface Todo {
  title: string;
  description: string;
  dueDate: Date;
  status: string;
  userEmail: string;
}

export const handler = async (event: SQSEvent) => {
  const records: SQSRecord[] = event.Records;

  for (let index = 0; index < records.length; index++) {
    const body = records[index].body;

    console.log('body from dlq:', body);

    const todo: Todo = JSON.parse(body);
    const todoId: string = todo.dueDate + '-' + todo.title;

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

    const snsClient = new SNSClient();
    const response = await snsClient.send(
      new PublishCommand({
        Message: 'The Todo with the following ID couldn\'t be processed: ' + todoId,
        TopicArn: process.env.TOPIC_ARN,
      })
    );
    console.log(response);
  }

  return;
};