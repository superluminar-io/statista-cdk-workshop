import { SQSEvent, SQSRecord } from 'aws-lambda';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

export const handler = async (event: SQSEvent) => {
  const records: SQSRecord[] = event.Records;

  for (let index = 0; index < records.length; index++) {
    const body = records[index].body;

    console.log("body from dlq:", body);

    const snsClient = new SNSClient();
    const response = await snsClient.send(
      new PublishCommand({
        Message: body,
        TopicArn: process.env.TOPIC_ARN, // make sure this matches the environment variable you set in the LambdaStack
      })
    );
    console.log(response);
  }

  return;
};
