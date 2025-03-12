# Setup


## How To Use This Workshop

This workshop is structured into several labs, each focusing on a specific AWS service or concept. Each lab contains:

- An introduction to the topic
- Hands-on exercises with step-by-step instructions
- Code that shows the desired end-state

Navigate through the labs in order, as each builds upon the previous one. Use the sidebar to move between sections.

If you get stuck during any of the steps, you can always check the end-state to see what you should have at the end of the particular step.
To see the difference between your current state and the end-state, you can use for example `diff -Nur --exclude=node_modules todo-service docs/labs/lab_2/goal/todo-service`.

To be able to `diff`, you'll need to check out this repository locally.

It's recommended to start with a new empty folder and copying the `todo-service` folder from this repository into it.

When this workshop describes filepaths, like `cdk/package.json`, they're always relative to that new folder.


## Start Docker

Start your Docker daemon.
Depending on your operating system, the process looks different, so the exact steps differ and are not covered here.


## Log in to AWS in your browser

Use the credentials provided by your instructor to log in to AWS in your browser:
1. Visit https://console.aws.amazon.com/iam/home, and choose "IAM user".
2. Enter the Account ID you received.
3. Enter the IAM user name and Password you received.

If you have problems logging in, please ask for help from your instructor.


## Set up AWS CLI

Add a profile for this workshop to your AWS CLI configuration.
Create a new file `~/.aws/config` and add the following:
```sh
[profile workshop]
aws_access_key_id = REPLACE_ME
aws_secret_access_key = REPLACE_ME
```

Then run the following command to make it active:
```sh
export AWS_PROFILE=workshop
# or
export AWS_DEFAULT_PROFILE=workshop
```

Run the following command to check if your AWS CLI is configured correctly:
```sh
aws sts get-caller-identity
```
This should return a JSON object with your AWS account information.
If you get an error, double check your credentials and configuration or ask for help from your instructor.

Your environment is now ready for the workshop labs!
