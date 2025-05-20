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