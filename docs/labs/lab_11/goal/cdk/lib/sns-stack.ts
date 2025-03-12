import * as cdk from 'aws-cdk-lib';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class SnsStack extends cdk.Stack {
  public topic: Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.topic = new Topic(this, "Topic");

    this.topic.addSubscription(
      new EmailSubscription("till.hoffmann+workshop@superluminar.io") // replace me
    );
  }
}