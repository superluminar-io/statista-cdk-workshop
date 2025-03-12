import { SQSEvent, SQSRecord } from 'aws-lambda';

export const handler = async (event: SQSEvent) => {
  const records: SQSRecord[] = event.Records;

  for (let index = 0; index < records.length; index++) {
    const body = records[index].body;
    console.log(body);
  }

  return;
};