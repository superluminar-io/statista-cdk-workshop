# Theory

In this lab, you'll learn how to run your containerized application on AWS.
You'll also connect it to a database running on AWS.

## Elastic Container Service (ECS)

AWS ECS (Elastic Container Service) is a container orchestration service that allows you to run and scale containerized applications on AWS.
It provides a highly available and scalable way to manage containerized applications, while abstracting away the underlying infrastructure details and its complexity.

## ECS Compute Engines

ECS supports two main compute engines: EC2 and Fargate.

EC2 is an AWS service that allows us to rent virtual machines on AWS.
The EC2 compute engine means that the containers will run on virtual machines, which are set up and managed by ECS.
We'd request resources in terms of CPU and memory we need from these EC2 instances.
To prevent the resources of these EC2 instances from being exhausted, we could set up a scaling mechanism for them.
We would need to pay for the EC2 instances we're using, no matter the containers running on them.

The Fargate engine even abstracts that away, so we'd only request the resources we need and AWS takes care of the rest.
We would also only pay for the exact resources our containers use.

This simplicity is what makes Fargate so popular for running containerized applications; You only need to care about your application and the resources you requested for it.

## ECS Service and ECS-task

ECS has two main concepts:

- **Service**: A service is a collection of tasks that are running on the same compute engine. They mostly relate to a specific application.
- **Task**: A task is a running instance of a containerized application.

Example: If we would have three parallel instances of our application running, we would have one service and three tasks.

While sometimes used as synonym, the term "task" is not the same as "container instance".
A task can contain multiple containers, but must have at least one essential container. The non-main containers are called "sidecar containers" and are used for various purposes, like log forwarding or monitoring. When the essential container exits, all others will be stopped as well.
