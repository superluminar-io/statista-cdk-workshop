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