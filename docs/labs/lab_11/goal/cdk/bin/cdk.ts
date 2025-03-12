#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcsStack } from '../lib/ecs-stack';
import { ElasticacheStack } from '../lib/elasticache-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { SqsStack } from '../lib/sqs-stack';
import { SnsStack } from '../lib/sns-stack';
const app = new cdk.App();
const vpcStack = new VpcStack(app, 'VpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
});

const elasticacheStack = new ElasticacheStack(app, 'ElasticacheStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
});

const sqsStack = new SqsStack(app, 'SqsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});

const snsStack = new SnsStack(app, 'SnsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});

const ecsStack = new EcsStack(app, 'EcsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
  databaseConnections: databaseStack.databaseConnections,
  databaseCredentialsSecret: databaseStack.dbCredentialsSecret,
  elasticacheConnections: elasticacheStack.connections,
  elasticacheEndpoint: elasticacheStack.endpointAddress,
  queue: sqsStack.queue,
});

const lambdaStack = new LambdaStack(app, 'LambdaStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
  queue: sqsStack.queue,
  dlq: sqsStack.dlq,
  topic: snsStack.topic,
});
