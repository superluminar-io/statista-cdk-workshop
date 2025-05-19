# Hands On

## Automating Secret handling

Did you notice we have a critical security issue in our setup?

The database credentials are still hardcoded in the code of the todo-service.

Since it's best practice to keep application code independent from the environment it's running in, it would be great if we could move the credentials to the environment variables. And if we could automatically retrieve them by our infrastructure code, as they are stored in AWS Secrets Manager anyway. Let's see what we can do.

First up, our application needs to read the credentials from the environment variables.
Replace the contents of the `todo-service/src/database.ts` file with the following code:

```typescript
import { DataSource } from "typeorm";
import { Todo } from "./entities/todo";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // Auto creates tables, disable in production
  logging: false,
  entities: [Todo],
});
```


The `process.env.*` statements mean that the application will pick up the values from environment variables.

Next, the environment variables need to be set to the correct values in the ECS stack.
First, we need a source where to read them from.
Open the database secret in the Secrets Manager console in your browser.
When you display the secret's contents and click on the `Plaintext` tab, you'll see that the key-value AWS shows, refers to the secret being JSON-formatted.
You'll need that knowledge in a moment.

In the `lib/ecs-stack.ts` file, at the end of the `taskImageOptions`, right after the `logDriver` of the `ApplicationLoadBalancedFargateService` properties, add the following lines:

```typescript
logDriver: //...
environment: {
  DB_HOST: 'postgres',
  DB_PORT: '5432',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'password',
  DB_NAME: 'postgres',
},
```

Well, now we still have the credentials hardcoded in the codebase - and the wrong ones at that - because we just moved them from the configuration file to the infrastructure...

Wouldn't it be nice if we could just read them from the secret manager?
Yes, that's possible, it's what we'll do next.

Since we already expose the `dbCredentialsSecret` from the databaseStack, we only need to pass it to the EcsStack and use the secret reference it represents.

Add the secret to the `EcsStackProps` in `lib/ecs-stack.ts`:

```typescript
// ...
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
// ...
interface EcsStackProps extends cdk.StackProps {
  vpc: Vpc;
  databaseConnections: Connections;
  databaseCredentialsSecret: ISecret;
}
```

Then, pass the secret reference from the databaseStack to the ecsStack in the `bin/cdk.ts` file:

```typescript
const ecsStack = new EcsStack(app, "EcsStack", {
  vpc: vpc,
  databaseConnections: databaseConnections,
  databaseCredentialsSecret: databaseStack.dbCredentialsSecret,
});
```

Okay, that resolves the necessary references. Next we need to use it and inject the values as environment variables into the ECS task.

In the `lib/ecs-stack.ts` file, rename the `environment` property to `secrets` and adjust the variables like in the following lines:

```typescript
// ...
import { AwsLogDriver, Cluster, ContainerImage, PropagatedTagSource, Secret } from "aws-cdk-lib/aws-ecs";
// ...
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
};
```

You can see, that in this case keys like `host` are referenced. That's because the secret is stored in JSON format and the `fromSecretsManager` function supports to extract a specific value from this JSON.

Now, no environment-specific credentials are now hardcoded in the codebase.

Deploy the changes now and verify the todo-service is working as expected by running some requests against it.

Did you notice how cdk automatically managed the permissions, so ECS can access the secret as necessary?

When the deployment is complete, check out the new ECS-task in the ECS console.
There's additional information towards the bottom of its details page.
Go to the `Environment variables and files` tab and check out how a secret references look like.
