# Hands On

## Create database in AWS

In the previous lab, we created a VPC in AWS. Now, we want to create a database in that VPC. We use the `DatabaseCluster` 
CDK construct for the purpose. To learn more about it, check the [documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds-readme.html).

## Adding a database stack

Back in our CDK code, create a new file `lib/database-stack.ts` and add the following code to it:

```typescript
import * as cdk from 'aws-cdk-lib';
import {
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

  constructor(scope: Construct, id: string, props?: DatabaseStackProps) {
    super(scope, id, props);

    const dbCluster = new DatabaseCluster(this, 'DatabaseCluster', {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_4,
      }),
      storageEncrypted: true,
      writer: ClusterInstance.provisioned('dbWriter', {
        instanceType: InstanceType.of(
          InstanceClass.BURSTABLE3,
          InstanceSize.MEDIUM
        ),
      }),
      vpc: props?.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      defaultDatabaseName: 'postgres',
    });
    dbCluster.connections.allowDefaultPortFrom(
        dbCluster.connections.securityGroups[0],
        'Allow access from the same security group',
    );

    this.dbCredentialsSecret = dbCluster.secret!;
  }
}
```

Similar to the VPC stack, you can see there's a public variable. `dbCredentialsSecret` contains the Secret object that contains the credentials for the database, so we can use it in our application later.
This stack needs to be added to the `bin/cdk.ts` file similarly to the `VpcStack`:

```typescript
// ...
import { DatabaseStack } from '../lib/database-stack';
// ...
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
  vpc: vpcStack.vpc,
});
```

The `vpcStack.vpc` is the object that was exposed by the `VpcStack` earlier. We now pass it to the `DatabaseStack` as a property, so it can use it to create the database in the VPC and its subnets.

Deploy the changes with the following command:

```sh
cdk deploy
# This command fails, please read on.
```

Oh no, we got an error!
Since we have two stacks now, we need to tell cdk which one to deploy. Or, since we want to deploy all our stacks, we can just add `--all` to the deployment command.

```sh
cdk deploy --all
# This command fails, please read on.
```

The creation of a RDS database takes roughly 10 minutes, so feel free to grab a coffee in the meantime.

After the deployment of this new stack is complete, check if you can find the database in the AWS console.
How is it configured? In which subnets is it running in? Does it have a security group?


## Connect the Todo Service with the Database on AWS

Now, with the new database, we should update the database configuration in the `todo-service/database.ts` file.

Replace the values in the `todo-service/database.ts` file with the values you can find in the Secret Manager Console in your browser.
There's a button "Retrieve secret value" at the side when you are in the secret's detail view.

```typescript
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "YOUR_CLUSTER_NAME.eu-central-1.rds.amazonaws.com", // Replace me as necessary
  port: 5432, // Replace me as necessary
  username: "YOUR_USERNAME", // Replace me as necessary
  password: "YOUR_PASSWORD", // Replace me as necessary
  database: "postgres", // Replace me as necessary
  synchronize: true, // Auto creates tables, disable in production
  logging: false,
  entities: [Todo],
});
```

## Connect to your database using Cloudshell

We can only connect to the database from within the VPC we created earlier. As an easy solution, we can use the AWS CloudShell. 
It's a browser-based shell that allows you to run commands in your AWS account without needing to install anything locally 
or start an EC2 instance in your VPC.

By default, the CloudShell is not in the same VPC as your database, but you can change that. To do that we need to create an VPC environment in the CloudShell.
1. Open the AWS Management Console in your browser.
2. Click on the CloudShell icon in the top right corner of the console.
3. Wait for the CloudShell to start. This may take a few moments.
4. Click on the "Actions" dropdown menu in the CloudShell.
5. Select "Create VPC Environment" and select the VPC you created earlier.

To connect to the database, we need the PostgreSQL client. It should already been installed in the CloudShell.
```sh
$ psql --version
psql (PostgreSQL) 15.12
```

Use the credentials from from the AWS Secrets Manager to connect to the database.
```sh
$ psql -h DB_HOSTNAME -U YOUR_USERNAME -d postgres
```