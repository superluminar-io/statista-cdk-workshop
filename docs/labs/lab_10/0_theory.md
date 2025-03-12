# Theory

In this lab, we'll look at AWS Lambda, and learn how to run code that runs on demand.
We'll also take a look at SQS, a message queue service that can be used to trigger Lambda functions.


## AWS Lambda

AWS Lambda is - similar to ECS with Fargate - a serverless compute service that lets you run code without provisioning or managing servers. It executes your code only when needed and scales automatically, from a few requests per day to thousands per second.


## Comparison with ECS Fargate

While both Lambda and ECS Fargate are serverless compute services, they serve different use cases:

ECS Fargate:
- Runs containerized applications continuously
- Better for long-running processes
- More control over runtime environment
- Predictable workloads with steady traffic
- Cost effective for consistent loads
- Higher memory limits (up to 120GB)
- No execution time limits

Lambda:
- Runs code in response to events
- Better for sporadic or burst workloads
- Less control but simpler deployment
- Limited to a maximum execution time of 15 minutes
- Pay only for actual execution time
- Lower memory limits (up to 10GB)
- Faster cold starts than containers


## Key Characteristics of Lambda Functions

1. Event-Driven
- Runs code in response to events like HTTP requests, database changes, file uploads, etc.
- Integrates natively with many AWS services as event sources, like file creation in S3 buckets or new messages in SQS queues
- Enables building reactive, event-driven architectures

2. Serverless
- No server management required
- AWS handles all infrastructure provisioning and maintenance
- You only pay for the compute time you consume
- Automatic scaling based on workload

3. Supported Runtimes
- Supports multiple programming languages including Node.js, Python, Java, Go, Ruby
- Custom runtime support via container images
- Built-in versioning and aliases for code management

4. Resource Limits & Configuration
- Memory allocation: 128MB to 10GB
- Maximum execution time: 15 minutes
- Concurrent execution limits
- Environment variables and layer support for dependencies

5. Cost Model
- Pay per request and compute time
- Free tier includes 1M requests per month
- No charge when code is not running
- Cost effective for variable or infrequent workloads

Lambda functions are ideal for microservices, data processing, backend APIs, and task automation. They enable rapid development and deployment while minimizing operational overhead and costs.


## SQS

SQS (Simple Queue Service) is a fully managed message queuing service that enables asynchronous communication between distributed system components. Key technical characteristics include:

1. Queue Types
- Standard queues: At-least-once delivery, best-effort ordering
- FIFO queues: Exactly-once processing, strict ordering guarantees
- Dead Letter Queues (DLQ): Capture failed message processing attempts

2. Message Properties
- Size limit: Up to 256KB per message
- Retention period: Configurable from 1 minute to 14 days
- Visibility timeout: Controls message lock during processing
- Message attributes for metadata

3. Scaling & Performance
- Nearly unlimited throughput for standard queues
- FIFO queues support up to 3000 messages/second with batching
- Automatic scaling of infrastructure
- Server-side encryption at rest using KMS

4. Integration Points
- Native event source for Lambda functions
- Supports long polling to reduce API calls
- Compatible with most programming languages via SDK
- Supports VPC endpoints for private networking

SQS provides the building blocks for decoupled, distributed architectures while handling the complexity of reliable message delivery and processing.
