import * as cdk from 'aws-cdk-lib';
import { IConnectable, Port, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { AwsLogDriver, Cluster, ContainerImage, PropagatedTagSource, Secret } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { IQueue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface EcsStackProps extends cdk.StackProps {
  vpc: Vpc;
  databaseConnections: IConnectable;
  databaseCredentialsSecret: ISecret;
  elasticacheConnections: IConnectable;
  elasticacheEndpoint: string;
  queue: IQueue;
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: EcsStackProps) {
    super(scope, id, props);

    const cluster = new Cluster(this, 'EcsCluster', {
      vpc: props?.vpc,
      enableFargateCapacityProviders: true,
    });

    const albFargateService = new ApplicationLoadBalancedFargateService(
      this,
      'TodoService',
      {
        cluster,
        cpu: 512,
        memoryLimitMiB: 1024,
        desiredCount: 2,
        taskImageOptions: {
          image: ContainerImage.fromAsset('../todo-service', {
            platform: Platform.LINUX_AMD64,
            exclude: ['node_modules'],
            outputs: ['type=docker'], // this is the magic line
          }),
          containerPort: 3000,
          logDriver: new AwsLogDriver({
            streamPrefix: 'ecs/todo-service',
            logRetention: RetentionDays.ONE_MONTH,
          }),
          secrets: {
            DB_HOST: Secret.fromSecretsManager(
              props!.databaseCredentialsSecret,
              'host'
            ),
            DB_PORT: Secret.fromSecretsManager(
                props!.databaseCredentialsSecret,
                'port'
            ),
            DB_USERNAME: Secret.fromSecretsManager(
                props!.databaseCredentialsSecret,
                'username'
            ),
            DB_PASSWORD: Secret.fromSecretsManager(
                props!.databaseCredentialsSecret,
                'password'
            ),
            DB_NAME: Secret.fromSecretsManager(
                props!.databaseCredentialsSecret,
                'dbname'
            ),
          },
          environment: {
            REDIS_ENDPOINT: props!.elasticacheEndpoint,
            QUEUE_URL: props!.queue.queueUrl,
          },
        },
        taskSubnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        propagateTags: PropagatedTagSource.SERVICE,
      }
    );
    
    albFargateService.service.connections.allowToDefaultPort(
      props!.databaseConnections
    );

    albFargateService.service.connections.allowToDefaultPort(
      props!.elasticacheConnections
    );

    albFargateService.service.connections.allowTo(
      props!.elasticacheConnections,
      Port.tcp(6380)
    );

    props!.queue.grantSendMessages(albFargateService.service.taskDefinition.taskRole);

    albFargateService.targetGroup.configureHealthCheck({
      path: '/health',
    });

    const scaling = albFargateService.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 60,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
    
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 60,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }
}
