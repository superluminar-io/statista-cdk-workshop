#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import {DatabaseStack} from "../lib/database-stack";
import {EcsStack} from "../lib/ecs-stack";
import {GhaPermissionsStack} from "../lib/gha-permissions-stack";

const app = new cdk.App();
const vpcStack = new VpcStack(app, 'VpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
});

const ecsStack = new EcsStack(app, 'EcsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
  databaseConnections: databaseStack.databaseConnections,
  databaseCredentialsSecret: databaseStack.dbCredentialsSecret,
});

new GhaPermissionsStack(app,'GhaPermissionsStack', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
    githubOrg: 'superluminar-io',
    githubRepo: 'statista-cdk-workshop',
});