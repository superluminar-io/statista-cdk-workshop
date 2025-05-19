# Theory

In this lab, you'll learn how to use secrets from the AWS Secrets Manager in your application.

## Environment-agnostic application configuration

Applications should be designed to be environment-agnostic, meaning they don't contain hardcoded configuration for different environments like development or production. Instead, they follow a consistent process of retrieving their configuration from predefined sources, typically environment variables that are set by the infrastructure.
This approach, known as the ["twelve-factor app" methodology for configuration](https://12factor.net/config), ensures that the same application code can run anywhere without modification. The application simply reads its configuration from the environment at runtime, whether that environment is a local development machine, a test server, or a production cluster. In our case, the application will retrieve database credentials from environment variables that are populated by ECS from AWS Secrets Manager, making the application completely unaware of which environment it's running in.

[The twelve-factor app](https://12factor.net) methodology has some great best-practice tips to improve applications, which are especially true for applications running in the cloud.
