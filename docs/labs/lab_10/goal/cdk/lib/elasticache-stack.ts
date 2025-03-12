import * as cdk from 'aws-cdk-lib';
import { aws_elasticache as ElastiCache } from 'aws-cdk-lib';
import { IVpc, Port, SecurityGroup, IConnectable, Connections } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface ElasticacheStackProps extends cdk.StackProps {
  vpc: IVpc;
}

export class ElasticacheStack extends cdk.Stack {
  public endpointAddress: string;
  public connections: IConnectable;

  constructor(scope: Construct, id: string, props?: ElasticacheStackProps) {
    super(scope, id, props);

    const securityGroup = new SecurityGroup(this, 'ElastiCacheSecurityGroup', {
      vpc: props!.vpc,
      allowAllOutbound: true,
    });

    this.connections = new Connections({
      defaultPort: Port.tcp(6379),
      securityGroups: [securityGroup],
    });

    const elasticache = new ElastiCache.CfnServerlessCache(
      this,
      'ServerlessCache',
      {
        engine: 'redis',
        serverlessCacheName: 'todo-service-cache',
        securityGroupIds: [securityGroup.securityGroupId],
        subnetIds: props!.vpc.privateSubnets.map((s) => s.subnetId),
      }
    );

    this.endpointAddress = elasticache.attrEndpointAddress;
  }
}