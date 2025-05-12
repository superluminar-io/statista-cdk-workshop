# Theory

In this lab, you'll learn how to write your own custom CDK construct to encapsulate a common infrastructure pattern: hosting a static website using S3 and CloudFront.

## What are Custom Constructs?

Custom Constructs in AWS CDK are reusable infrastructure building blocks. While AWS CDK provides many built-in constructs (like Bucket, Function, or Cluster), you can also define your own by combining multiple constructs into a higher-level abstraction.

This approach is useful when:

- You find yourself repeating similar patterns across multiple stacks 
- You want to hide complexity behind a simple interface 
- You want to share common infrastructure setups across teams or projects