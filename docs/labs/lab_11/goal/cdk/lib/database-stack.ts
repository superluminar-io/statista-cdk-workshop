import * as cdk from 'aws-cdk-lib';
import {
  IConnectable,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import {
  AuroraPostgresEngineVersion,
  ClusterInstance,
  DatabaseCluster,
  DatabaseClusterEngine,
} from 'aws-cdk-lib/aws-rds';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: IVpc;
}

export class DatabaseStack extends cdk.Stack {
  public dbCredentialsSecret: ISecret;
  public databaseConnections: IConnectable;

  constructor(scope: Construct, id: string, props?: DatabaseStackProps) {
    super(scope, id, props);

    const dbCluster = new DatabaseCluster(this, 'DatabaseCluster', {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_4,
      }),
      storageEncrypted: true,
      writer: ClusterInstance.provisioned('dbWriter', {
        instanceType: InstanceType.of(
          InstanceClass.BURSTABLE4_GRAVITON,
          InstanceSize.MEDIUM,
        ),
      }),
      readers: [
        ClusterInstance.provisioned('dbReader', {
          instanceType: InstanceType.of(
            InstanceClass.BURSTABLE4_GRAVITON,
            InstanceSize.MEDIUM
          ),
        }),
      ],
      vpc: props?.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      defaultDatabaseName: 'postgres',
    });

    this.dbCredentialsSecret = dbCluster.secret!;
    this.databaseConnections = dbCluster.connections;
  }
}
