# Hands On

## Attention!!

This part is a task for the whole group. If you already reach this part of the workshop, feel free to read a head. But please wait for the rest of the group to catch up, since we will do this together.

## Github Permissions and Configuration

To allow you to deploy your CDK app from GitHub Actions, we need to set up a few things:
- **GitHub OIDC**: This allows GitHub to authenticate to AWS without using long-lived access keys.
- **IAM Role**: This role will be assumed by GitHub Actions to deploy your CDK app.
- **GitHub Actions Workflow**: This is the YAML file that defines the steps to deploy your CDK app.

## CDK Deployments in CI/CD

AWS CDK deployments go through a few key phases:

1. **Install dependencies**
   Install the AWS CDK CLI and required project packages

2. **Synthesize the CloudFormation template**
   Run `cdk synth` to generate a template from your code

3. **Test your CDK app**
   Run a test suite to validate your CDK app and your application code

4. **Diff (optional)**
   Compare the current deployed stack with the upcoming changes

5. **Deploy**
   Run `cdk deploy` to apply the changes

## GitHub Actions

[GitHub Actions](https://docs.github.com/en/actions) is a powerful automation platform for CI/CD. It lets you define workflows using YAML files in your repository that react to events like `push`, `pull_request`, or scheduled triggers.

In this lab, we’ll use GitHub Actions to:

* Deploy our CDK app on every branch push to a specific branch (e.g., `main`)
* Use an **OpenID Connect (OIDC)** role to authenticate to AWS (without long-lived access keys)
* Add approval logic or environment-specific triggers

## Example Workflow Structure

A typical CDK GitHub Actions workflow might include:

```yaml
name: Deploy CDK App

on:
  push:
    branches: [YOUR_BRANCH_NAME]

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npx cdk synth
      - run: npx cdk deploy --require-approval never
        env:
          AWS_REGION: eu-central-1
```

## Allowing GitHub to Deploy to AWS

To allow our GitHub Actions workflow to deploy to AWS, we need to set up an IAM role that GitHub can assume. This role will have the necessary permissions to create and update AWS resources.

We start by creating an IAM role that GitHub Actions can assume to deploy our CDK app. This role will reference an OIDC provider and therefore have the necessary permissions to create and update AWS resources.
First, we create a new file `lib/gha-permissions-stack.ts` and add the following code:

```typescript
import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Conditions, ManagedPolicy, OpenIdConnectProvider, Role, WebIdentityPrincipal} from "aws-cdk-lib/aws-iam";

export interface GhaPermissionsStackProps extends StackProps {
    readonly githubOrg: string;
    readonly githubRepo: string;
}

export class GhaPermissionsStack extends Stack {
    constructor(scope: Construct, id: string, props: GhaPermissionsStackProps) {
        super(scope, id, props);

        const githubProvider = new OpenIdConnectProvider(this, 'GithubActionsProvider', {
            url: 'https://token.actions.githubusercontent.com',
            clientIds: ['sts.amazonaws.com'],
        })

        const conditions: Conditions = {
            StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            },
            StringLike: {
                'token.actions.githubusercontent.com:sub': `repo:${props.githubOrg}/${props.githubRepo}:*`
            },
        }

        new Role(this, 'GitHubDeployRole', {
            assumedBy: new WebIdentityPrincipal(githubProvider.openIdConnectProviderArn, conditions),
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
            roleName: 'githubActionsDeployRole',
            description: 'This role is used via GitHub Actions to deploy with AWS CDK on the target AWS account',
            maxSessionDuration: Duration.hours(1),
        })
    }

}
```

There is a lot going on in this code, so let's break it down:
- **OpenIdConnectProvider**: This creates an OIDC provider for GitHub Actions. It allows AWS to trust the tokens issued by GitHub.
- **WebIdentityPrincipal**: This is the principal that is allowed to assume the role. It uses the OIDC provider and specifies conditions for the token.
- **Conditions**: These are the conditions that must be met for the role to be assumed. In this case, we are checking that the token is from GitHub Actions and that it matches the specified repository.
- **Role**: This creates the IAM role that GitHub Actions will assume. It has the `AdministratorAccess` managed policy attached to it, which gives it full access to AWS resources. You can adjust this policy to limit the permissions as needed.

After we created this stack, we again need to adjust the `bin/cdk.ts` file to include the new stack. Add the following lines to it:

```typescript
import {GhaPermissionsStack} from "../lib/gha-permissions-stack";

// ...

new GhaPermissionsStack(app,'GhaPermissionsStack', {
   env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'eu-central-1' },
   githubOrg: 'superluminar-io',
   githubRepo: 'statista-cdk-workshop',
});
```

And again, we need to deploy the changes:

```sh
cdk deploy --all
```

## GitHub Actions Workflow

Now we need to create a GitHub Actions workflow that will deploy our CDK app. Create a new file in your repository at `.github/workflows/deploy.yml` and add the following code:

```yaml
name: Deploy CDK App

on:
   push:
      branches: ['main']
env:
   AWS_ACCOUNT: YOUR_AWS_ACCOUNT_ID
   AWS_REGION: eu-central-1
   REPOSITORY_NAME: todo-service

jobs:
   deploy-cdk:
      runs-on: ubuntu-latest

      defaults:
         run:
            working-directory: cdk

      permissions:
         id-token: write
         contents: read

      steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
              node-version: 22
              
         - run: echo "IMAGE_TAG=$(git rev-parse --short HEAD)" >> $GITHUB_ENV

         - run: npm ci
         - run: npm run test
         - run: npx cdk synth --context imageTag=$IMAGE_TAG
         - run: npx cdk deploy --all --require-approval never --context imageTag=$IMAGE_TAG
```

To test it out, make a change to your CDK app and push it to the `main` branch. This should trigger the GitHub Actions workflow and deploy your CDK app to AWS.


## Integrating AWS Credentials

As you might have guessed, the workflow will not succeed yet, because we need to provide the AWS credentials to the GitHub Actions workflow.
To do this, we simply use the `aws-actions/configure-aws-credentials` action and configure it to use the role we created earlier.

```yaml
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ env.AWS_ACCOUNT }}:role/githubActionsDeployRole
          role-session-name: deploy-from-github-actions
          aws-region: ${{ env.AWS_REGION }}

      - run: npm ci
      - run: npm run test
      - run: npx cdk synth --context imageTag=$IMAGE_TAG
      - run: npx cdk deploy --all --require-approval never --context imageTag=$IMAGE_TAG
```

## Conclusion

In this lab, we learned how to set up a GitHub Actions workflow to deploy our CDK app to AWS. We also learned how to use OpenID Connect (OIDC) to authenticate to AWS without using long-lived access keys.
