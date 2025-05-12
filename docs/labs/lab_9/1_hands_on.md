# Hands On

## Goal

We’ll build a StaticWebsite construct that:

- Creates an S3 bucket for public hosting 
- Uploads a local website/ folder to the bucket 
- Adds a CloudFront distribution in front of it

This setup is useful for:

- Landing pages 
- Documentation hosting 
- Static frontends

## Step 1 – Create the Custom Construct

Create a new file `lib/static-website.ts`:

```typescript
import { Construct } from 'constructs';
import { Bucket, BucketAccessControl, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { CloudFrontWebDistribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export interface StaticWebsiteProps {
  websitePath: string;
}

export class StaticWebsite extends Construct {
  public readonly distribution: CloudFrontWebDistribution;

  constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
    super(scope, id);

    const bucket = new Bucket(this, 'WebsiteBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      accessControl: BucketAccessControl.PRIVATE,
    });

    const oai = new OriginAccessIdentity(this, 'OAI');

    this.distribution = new CloudFrontWebDistribution(this, 'WebsiteCDN', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: oai,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    new BucketDeployment(this, 'DeployWebsite', {
      destinationBucket: bucket,
      sources: [Source.asset(path.resolve(props.websitePath))],
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });
  }
}
```

This construct does everything needed to serve a static website through a secure CloudFront distribution.


## Step 2 – Use the Construct in a Stack

Create `lib/static-site-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StaticWebsite } from './static-website';

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new StaticWebsite(this, 'MyWebsite', {
      websitePath: './website',
    });
  }
}
```

Make sure you have a local folder named `website/` containing at least an `index.html` file. For example:

```html
<!-- website/index.html -->
<html>
  <body>
    <h1>Hello from my custom CDK construct!</h1>
  </body>
</html>
```

## Step 3 – Register the Stack in `bin/cdk.ts`

```typescript
import { StaticSiteStack } from '../lib/static-site-stack';

new StaticSiteStack(app, 'StaticSiteStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
});

```

## Step 4 – Deploy the Stack

```sh
cdk deploy
```

Once deployed, you’ll see the CloudFront distribution domain in the output. Open it in your browser — your site should be live!


## Summary

You've now built and deployed a reusable StaticWebsite CDK construct. You can easily:

- Use it in multiple stacks 
- Parameterize its behavior (e.g. default document, error page, custom domain)
- Publish it as part of an internal CDK library

This pattern scales from small teams to large organizations and helps keep your infrastructure code clean, consistent, and testable.