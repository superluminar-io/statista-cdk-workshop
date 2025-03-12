# Theory

In this lab, you'll learn how to use secrets from the AWS Secrets Manager in your application.

## Environment-agnostic application configuration

Applications should be designed to be environment-agnostic, meaning they don't contain hardcoded configuration for different environments like development or production. Instead, they follow a consistent process of retrieving their configuration from predefined sources, typically environment variables that are set by the infrastructure.
This approach, known as the ["twelve-factor app" methodology for configuration](https://12factor.net/config), ensures that the same application code can run anywhere without modification. The application simply reads its configuration from the environment at runtime, whether that environment is a local development machine, a test server, or a production cluster. In our case, the application will retrieve database credentials from environment variables that are populated by ECS from AWS Secrets Manager, making the application completely unaware of which environment it's running in.

[The twelve-factor app](https://12factor.net) methodology has some great best-practice tips to improve applications, which are especially true for applications running in the cloud.


## AWS Security Hub

AWS Security Hub is a centralized security monitoring service that aggregates and processes security findings from across AWS accounts and services. It acts as a single pane of glass for security teams to view and manage their security and compliance state.

The service continuously evaluates the environment against security standards and best practices, generating findings when issues are detected. These automated checks help identify misconfigurations, vulnerabilities, and potential security threats.

Security Hub integrates with other AWS security services like GuardDuty, Inspector, and Macie, as well as third-party security tools. This integration allows teams to:
- View all security findings in one place
- Track security trends over time
- Automate security checks and responses
- Monitor compliance with various security standards

While Security Hub is particularly valuable for organizations managing multiple AWS accounts, it provides the same benefits for single-account environments. Even with just one account, it eliminates the need to manually check multiple security tools and dashboards by providing a consolidated view that helps teams focus on addressing the most important security issues.
