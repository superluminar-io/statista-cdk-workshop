# Setup


## How To Use This Workshop

This workshop is structured into several labs, each focusing on a specific AWS service or concept. Each lab contains:

- An introduction to the topic
- Hands-on exercises with step-by-step instructions
- Code that shows the desired end-state

Navigate through the labs in order, as each builds upon the previous one. Use the sidebar to move between sections.

If you get stuck during any of the steps, please do not hesitate to ask for help from your instructor or fellow participants.

It's recommended to start with a new empty folder and copying the `todo-service` folder from this repository into it.

When this workshop describes filepaths, like `cdk/package.json`, they're always relative to that new folder.


## Start Docker

Start your Docker daemon.
Depending on your operating system, the process looks different, so the exact steps differ and are not covered here.


## Log in to AWS in your browser

Use the username and password provided to you earlier to log in to AWS in your browser:
1. Visit https://console.aws.amazon.com/iam/home, and choose "IAM user".
2. Enter the Account ID you received.
3. Enter the IAM user name and Password you received.

If you have problems logging in, please ask for help from your instructor.

## Generate AWS Access Keys

For the next step you need to generate AWS access keys for the IAM user you just logged in with.

1. In the AWS Management Console, navigate to the IAM service.
2. In the left sidebar, click on "Users".
3. Click on your IAM user name.
4. In the "Security credentials" tab, scroll down to the "Access keys" section.
5. Click on "Create access key".
6. Select "Command line interface" as the use case.
7. Click "Next" to confirm the hint about alternatives.
8. Click "Create access key".
9. Either download the access key file or copy the Access key ID and Secret access key. This is the only time you'll see them, so make sure to save them securely.


## Set up AWS CLI

Add a profile for this workshop to your AWS CLI configuration.
Create a new file `~/.aws/config` and add the following, replacing the values with the ones you received in the previous step:

```ini
[profile workshop]
aws_access_key_id = REPLACE_ME
aws_secret_access_key = REPLACE_ME
```

Then run the following command to make it active:
```sh
export AWS_PROFILE=workshop
```

Run the following command to check if your AWS CLI is configured correctly:
```sh
aws sts get-caller-identity
```
This should return a JSON object with your AWS account information.
If you get an error, double-check your credentials and configuration or ask us for help.

Your environment is now ready for the workshop labs!
