# Theory


## SNS

Amazon Simple Notification Service (SNS) is a fully managed pub/sub messaging service that enables you to decouple microservices, distributed systems, and serverless applications. It allows you to send messages or notifications to multiple subscribers through a "topic".

Key features of SNS:
- Publishers send messages to topics
- Topics can have multiple subscribers
- Messages are pushed immediately to all subscribers
- Highly available and durable across multiple AZs

SNS supports several delivery methods (protocols) for subscribers:
- HTTP/HTTPS endpoints
- Email (raw or formatted)
- Amazon SQS queues
- AWS Lambda functions
- Mobile push notifications (iOS, Android, etc.)
- SMS text messages

Common use cases include:
- Application alerts and monitoring
- Workflow automation
- Mobile notifications
- System alerts and events
- Cross-account/cross-region message delivery

## SNS vs SQS

While SNS and SQS are both messaging services, they serve different purposes and can work together effectively:

SNS (Push):
- Push-based messaging (actively sends to subscribers)
- One-to-many communication
- No message persistence (delivered once or lost)
- Immediate delivery to multiple subscribers

SQS (Pull):
- Pull-based messaging (consumers poll for messages)
- One-to-one communication
- Messages persist until processed
- Can handle back pressure and scaling

Together:
SNS can publish messages to SQS queues as subscribers, creating powerful patterns like:
- Fan-out architecture (one message to multiple queues)
- Message durability (SNS for immediate delivery, SQS for persistence)
- Workload isolation (different queues for different processing needs)
