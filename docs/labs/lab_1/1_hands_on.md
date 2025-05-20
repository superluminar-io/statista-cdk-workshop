# Hands On

## Create a VPC Stack

In the `bin/cdk.ts` file, you can find some sample lines to define the environment for the Stack like account and region.
We'll change this to force CDK to use the `eu-central-1` region soon.

As it's a best practice to separate the Stacks by their purpose, we'll create one Stack per decoupled resource.
First, delete the existing `lib/cdk-stack.ts` file, create a new file `lib/vpc-stack.ts` and add the following code to it:

```typescript
import * as cdk from "aws-cdk-lib";
import { IpAddresses, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class VpcStack extends cdk.Stack {
  public vpc: Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, "Vpc", {
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "private",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1,
    });
  }
}
```

The code above creates a VPC with the subnet range `10.0.0.0/16`.
In it, there will be one public and one private subnet per availability zone - each one with a `/24` network (like `10.0.0.0/24`, `10.0.1.0/24`, etc.).
While it's best practice to have one NAT gateway per availability zone for high availability, we're only creating one here for simplicity and cost reasons.
The number of NAT gateways won't impact the outcome of this lab.

The `VpcStack` class in the `lib/vpc-stack.ts` file has a public `vpc` property, which is assigned to the VPC instance. That means, we'll be able to access the VPC object from outside this stack.

Next, adjust the references in the `bin/cdk.ts` file according to the new file.
Replace the contents, so it looks like the following codeblock:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';

const app = new cdk.App();
const vpcStack = new VpcStack(app, 'VpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});
```

As described earlier, we can let CDK decide which account to deploy to, based on our AWS configuration. In our case, we want to specify the region explicitly. That's because the default region is `us-east-1`.
In comparison to the previous `new CdkStack`, our new `VpcStack` is assigned to a variable. That's necessary to later be able to use its output – the VPC object.

Check if your syntax is correct by running a dry-run of the deployment with the following command:

```sh
cdk synth
```

This command triggers the **synthesis phase** of your CDK application.

### CDK Application Lifecycle

When you use AWS CDK, there are two main phases involved in creating infrastructure:

#### 1. **Synthesis**

This is the phase where CDK takes your code (written in TypeScript, Python, or another supported language) and converts it into a **CloudFormation template**. This happens locally on your machine. The result is a `.json` or `.yaml` file that defines the infrastructure in a declarative way—just like you would write by hand in plain CloudFormation, but automatically generated from your higher-level CDK code.

You can inspect this template in the `cdk.out/` directory. Understanding what CDK synthesizes can help with:

* Debugging issues in complex setups
* Explaining changes during code reviews
* Validating that the correct resources and configurations are being generated

#### 2. **Deployment**

In the **deployment phase**, CDK hands the synthesized CloudFormation template over to the **AWS CloudFormation service**. This happens via the `cdk deploy` command. CloudFormation then compares the current state of your infrastructure with the desired state described in the template and makes the necessary changes—creating, updating, or deleting resources as needed.

This approach provides:

* **Change tracking**: every deployment is recorded in the CloudFormation console
* **Safety mechanisms**: if something fails during deployment, CloudFormation rolls back the changes
* **Consistency**: deployments are always based on a complete, versioned template

Here’s an overview of the flow:

```
Your CDK Code (TypeScript, Python, etc.)
                |
                v
      CDK Synthesizer (cdk synth)
                |
                v
   CloudFormation Template (JSON/YAML)
                |
                v
 CDK Deployment Engine (cdk deploy)
                |
                v
 AWS CloudFormation (creates/updates resources)
                |
                v
Deployed Infrastructure (VPCs, Databases, etc.)
```

Each phase plays a critical role:

* **Synthesis** ensures that your code can be transformed into valid infrastructure configuration
* **Deployment** ensures that your desired configuration is correctly applied to the AWS environment

If the `cdk synth` command runs without error, you can be confident that your code is valid and can move on to deploying it.

## Exercise: Understand Changes with `cdk diff`

Now that you've successfully synthesized your CDK app, let’s explore the next step before deploying: checking what will change in your AWS environment.

AWS CDK provides a built-in command for this purpose:

```sh
cdk diff
```

### What does `cdk diff` do?

This command compares the current deployed state of your stack (as known to AWS CloudFormation) with the changes in your local CDK app. It then prints a human-readable summary of the differences.

Use it to:

* **See what resources will be created, modified, or deleted**
* **Understand unintended changes before they happen**
* **Review infrastructure changes as part of code reviews or pull requests**

### Try it out

1. Make a small change in your `VpcStack`. For example, increase the number of NAT gateways from `1` to `2`:

```typescript
natGateways: 2,
```

2. Run the `cdk diff` command:

```sh
cdk diff
```

3. Observe the output. You should see something like:

```
Stack VpcStack
Resources
[+] AWS::EC2::NatGateway Vpc/PublicSubnet1/NATGateway ...
```

The `+` sign means a new resource will be created. You’ll also see explanations if resources are replaced or deleted.

4. Revert the change before continuing the workshop if you don’t want the additional cost of a second NAT gateway.

### Optional: Review Your Stack's Current State

For extra practice, navigate to the AWS CloudFormation console in your browser, select your stack (`VpcStack`), and inspect:

* The **Resources** tab – to see what’s currently deployed
* The **Template** tab – to view the last deployed CloudFormation template
* The **Change Sets** – which is what CDK is simulating with `cdk diff`

### Why this matters

Using `cdk diff` regularly is one of the most important habits in CDK-based development. It gives you confidence in what will happen—before it happens. This is especially important in production environments, or when working in teams.

---

Now, deploy the stack with one of the following commands:

```sh
cdk deploy --all
```

Verify the changes in the AWS console in your browser.
Check if you can find the VPC, the subnets, the route tables, the NAT gateways, and the internet gateway under the VPC Console (search for `VPC` in the navigation bar).
Was everything as you expected?
