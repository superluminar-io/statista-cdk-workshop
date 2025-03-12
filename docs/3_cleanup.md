# Clean-Up: Deleting AWS Resources

Before you clean up all the resources, feel free to explore the AWS Console and recap what you did and what you've learned.

You can also revisit this section later, when you're ready to delete the resources you've created.


## Overview

After completing the labs, it's important to clean up the resources you have created to avoid incurring any unnecessary costs. This clean-up guide will help you delete all the AWS resources created during Labs.


## Steps to Clean Up


### 1. Delete the Resources Using CDK

The simplest way to delete all resources created by your CDK code is to destroy the stacks. This will automatically clean up all resources managed by CDK / CloudFormation.

1. **Open Your Terminal**

   Navigate to your latest `cdk` folder.

2. **Run the CDK Destroy Command**

   Run the following command to destroy the stack:

   ```sh
   cdk destroy --all
   ```

   Confirm the deletions when prompted. This will delete all resources created by CDK / CloudFormation.

   Alternatively, after triple checking you're using the right folder and accounts, you can skip the prompts:
   
   ```sh
   cdk destroy --all --require-approval never # This is a dangerous command. Don't use this in production.
   ```


### 2. Manual Verification (Optional)

To ensure all resources are properly deleted, you can manually verify the deletion using the AWS Management Console and CLI.

**AWS Management Console**:

- **VPC**: Navigate to the VPC Console and verify that the VPC and associated resources (subnets, route tables, security groups) are deleted.
- **ALB**: Navigate to the EC2 Console and verify that the Load Balancer is no longer listed.
- **ECS**: Navigate to the ECS Console and verify that the cluster is deleted.
- **RDS**: Navigate to the RDS Console and verify that the database is deleted.
- **Elasticache**: Navigate to the Elasticache Console and verify that the cluster is deleted.


### 3. Check For Remaining Resources (Recommended)

After completing the above steps, it's a good practice to double-check for any remaining resources:

- Review the AWS Cost Explorer to ensure there are no unexpected charges.
- Check other AWS services not mentioned above (e.g., CloudWatch logs) to ensure complete cleanup.


## Summary

By following these steps, you will ensure that all resources created during the labs are properly cleaned up, avoiding unnecessary costs. The `cdk destroy --all` command is the primary method for clean-up, but manual verification steps are provided for completeness. Always double-check your AWS account to confirm all resources have been removed.
