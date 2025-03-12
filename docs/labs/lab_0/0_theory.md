# Theory

In this lab, you will set up AWS-CDK on your machine, create a new cdk-project and explore how CloudFormation Stacks look like in the AWS console.


## AWS-CDK

AWS Cloud Development Kit (AWS CDK) is an Infrastructure as Code (IaC) framework that allows you to define cloud infrastructure using familiar programming languages like TypeScript, Python, Java and others. Instead of writing configuration files manually, you write actual code that synthesizes into AWS CloudFormation templates.

CloudFormation is AWS's native IaC service that uses JSON or YAML templates to describe and provision infrastructure resources. CDK essentially acts as an abstraction layer on top of CloudFormation, converting your high-level code into CloudFormation templates behind the scenes.

The key benefits of using Infrastructure as Code include:

- Version Control: Infrastructure changes can be tracked in source control just like application code
- Automation: Infrastructure deployments can be automated and repeated consistently
- Documentation: The code itself serves as documentation of your infrastructure
- Testing: Infrastructure configurations can be tested before deployment
- Consistency: Eliminates manual configuration errors and ensures environments are identical
- Scalability: Makes it easy to replicate infrastructure across multiple environments or regions


## Stacks in AWS CDK and CloudFormation

In AWS CDK and CloudFormation, a Stack is the fundamental unit of deployment. It represents a collection of AWS resources that are created, updated, or deleted together as a single unit. Think of a stack as a blueprint for a specific set of infrastructure components that work together to support your application.

Some key points about stacks:

- Each stack is deployed independently and has its own lifecycle
- Resources within a stack can reference each other
- Stacks can be reused across different environments and accounts (dev, staging, prod)
- When you delete a stack, all resources within it are deleted
- Stacks can share resources through exports and imports
- Changes to a stack are applied as atomic updates - if one resource fails, the entire stack deployment is rolled back to the last known good state

In CDK, you define stacks as classes, while in CloudFormation they are defined as JSON or YAML templates. CDK automatically converts your stack code into CloudFormation templates during deployment.


## Level 1 and Level 2 Constructs in CDK

AWS CDK constructs come in different abstraction levels. Level 1 (L1) constructs, identifiable by their `Cfn` prefix (like `CfnServerlessCache`), are direct one-to-one mappings to CloudFormation resources and require detailed configuration. Level 2 (L2) constructs build on top of these, providing higher-level abstractions that implement AWS best practices by default while hiding much of the underlying complexity.
