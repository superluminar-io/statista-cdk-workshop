# Theory

In this lab, you’ll learn how to create and manage your own **Amazon Elastic Container Registry (ECR)** repository and use it as a deployment source in your CDK-based infrastructure.

## What is Amazon ECR?

Amazon Elastic Container Registry (ECR) is a fully managed Docker container registry that makes it easy to store, manage, and deploy container images on AWS. It supports private and public registries and integrates tightly with AWS services like ECS, EKS, and Lambda.

Some key benefits of using ECR:

* **Fully managed and secure**: AWS handles availability, scalability, and encryption
* **High-speed access within AWS**: Image pull latency is minimized across regions
* **Access control via IAM**: Fine-grained control over who can push or pull images
* **Built-in lifecycle policies**: Automatically clean up old or unused images
* **Auditability**: Integrated with CloudTrail for tracking access and usage

## CDK and Container Images

When you use `ContainerImage.fromAsset()` in CDK, it conveniently builds your Docker image locally and uploads it to a CDK-managed ECR repository. This is great for local testing and prototyping—but it lacks flexibility in more complex deployment setups.

For example:

* You don’t see or manage the repository in the AWS Console
* Images are tied tightly to CDK deployments
* There’s no control over tag naming or promotion strategies
* Sharing the image across multiple environments or accounts becomes difficult

## Why Manage ECR Explicitly?

Defining the ECR repository as part of your CDK app gives you full control over the **container lifecycle** in your AWS architecture. This unlocks several important capabilities:

### 1. **Multi-environment Deployment**

In real-world projects, you often have multiple environments like `dev`, `staging`, and `prod`—sometimes even across **different AWS accounts**. By using a dedicated ECR repository:

* Your CI system can **build and push** the image once
* CDK in each environment can **refer to the same image** (by tag) without rebuilding
* You can decouple application builds from infrastructure deployment

This avoids situations where the same app version might behave differently in different environments.

### 2. **Versioning and Rollbacks**

By tagging your images with something meaningful (like a Git commit SHA), you can:

* Track exactly what’s deployed where
* Roll back to previous versions if needed
* Promote known-good versions across environments

This is a cornerstone of reproducible infrastructure.

### 3. **Separation of Concerns**

Managing the repository separately from the container image allows your infrastructure code (CDK) and your application code (e.g. Node.js, Python) to evolve independently.

Your CDK code only needs to reference the repository and a tag—it doesn’t need to know how the image was built or where the source code lives.

---

In this lab, you’ll:

* Create a named ECR repository using CDK
* Build and tag a container image manually (e.g. using `git rev-parse`)
* Push that image to ECR
* Deploy your ECS service using that image tag

This is a best-practice pattern that reflects how modern teams handle deployments in production.
