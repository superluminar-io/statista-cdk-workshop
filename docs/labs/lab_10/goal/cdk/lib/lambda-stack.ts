import * as cdk from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IQueue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  vpc: IVpc;
  queue: IQueue;
  dlq: IQueue;
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
        deadLetterQueue: props!.dlq,
      }
    );

    fileProcessingLambda.addEventSource(new SqsEventSource(props!.queue));
  }
}