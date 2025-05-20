# Theory

In this lab, you'll learn how to set up a **CI/CD pipeline** for your AWS CDK application using **GitHub Actions**. The pipeline will automatically **synthesize**, **diff**, and **deploy** your CDK stacks whenever you push changes to a GitHub repository.

## Why CI/CD for CDK?

Infrastructure as Code (IaC) lets you define and manage cloud infrastructure through version-controlled files. However, just having code isn't enough—you also need a way to **reliably apply changes** across environments. That’s where **Continuous Integration and Continuous Deployment (CI/CD)** comes in.

CI/CD allows you to:

* **Test infrastructure changes before deployment**
* **Automatically deploy changes to dev/staging/production environments**
* **Ensure consistent and repeatable deployments**
* **Audit and track changes through Git history**
* **Speed up delivery and reduce manual intervention**

By integrating your CDK project with GitHub Actions, you can treat infrastructure just like application code—versioned, reviewed, and automatically deployed.

There are many other CI/CD tools available, such as **GitLab CI**, **CircleCI**, **Travis CI**, and **AWS CodePipeline**. However, GitHub Actions is particularly well-suited for this workshop because:
* It’s integrated directly into GitHub, making it easy to set up and manage
* It supports a wide range of actions and workflows
* It is the standard tooling for many companies and projects, and you might have used it before

## GitHub Actions in this Workshop

Since it requires a bit of setup to be able to deploy our CDK app from GitHub Actions, we will do this as a mob session with the whole group.
So if you already reach this part of the workshop, feel free to read a head. But please wait for the rest of the group to catch up, since we will do this together.