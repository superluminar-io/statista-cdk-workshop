#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcsStack } from '../lib/ecs-stack';
import { ElasticacheStack } from '../lib/elasticache-stack';

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

const ecsStack = new EcsStack(app, 'EcsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
  databaseConnections: databaseStack.databaseConnections,
  databaseCredentialsSecret: databaseStack.dbCredentialsSecret,
  elasticacheConnections: elasticacheStack.connections,
  elasticacheEndpoint: elasticacheStack.endpointAddress,
});
