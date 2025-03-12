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


As described earlier, we can let CDK decide which account to deploy to, based on our aws configuration. In our case, we want to specify the region explicitly. That's because the default region is `us-east-1`.
In comparison to the previous `new CdkStack`, our new `VpcStack` is assigned to a variable. That's necessary to later be able to use its output - the VPC object.

Check if your syntax is correct by running a dry-run of the deployment with the following command:

```sh
cdk synth
```

This command creates a CloudFormation template in the `cdk.out` directory and prints it directly to the console. This workshop won't cover how to read CloudFormation templates, but the command is still useful to check if your syntax is correct.
For now, just know, if there was no error, your syntax is correct.

Now, deploy the stack with one of the following commands:

```sh
cdk deploy --all
```

Verify the changes in the AWS console in your browser.
Check if you can find the VPC, the subnets, the route tables, the NAT gateways, and the internet gateway under the VPC Console (search for `VPC` in the navigation bar).
Was everything as you expected?
