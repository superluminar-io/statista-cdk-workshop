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