# Theory

In this lab, you'll learn how to run load tests against your service, how they affect its metrics and how you can use the results to improve the resources assigned to the service and database.


## Metrics


Metrics are quantitative measurements that help monitor and understand the health, performance, and behavior of systems and applications. They provide data points that can be tracked over time to identify trends, anomalies, and potential issues before they become critical problems.

While logs are text output that signal specific events (like error messages, API requests, or database queries) with details like timestamps and stack traces, metrics are numerical values that track system performance and behavior over time.
For example, a log might show "User abc123 failed to authenticate at 2024-03-20 15:04:32 - Invalid password", whereas a metric would track "Number of failed logins per minute". Logs help you debug specific issues, while metrics help you monitor trends like increasing error rates or declining performance.

Common types of metrics include:

- Resource metrics: CPU usage, memory consumption, disk I/O, network throughput
- Application metrics: Request latency, error rates, active users, transaction throughput
- Business metrics: Conversion rates, user engagement, revenue per user
- Infrastructure metrics: Instance health, auto-scaling events, database connections

For cloud applications, metrics are crucial because they:

1. Enable proactive monitoring and alerting when systems deviate from normal behavior
2. Help diagnose and troubleshoot issues by providing visibility into system state
3. Guide capacity planning and resource optimization decisions
4. Validate the impact of code changes and infrastructure modifications
5. Support data-driven scaling policies and performance tuning

AWS provides built-in metrics through CloudWatch for most of its services, while application-specific metrics can be collected using custom metrics, APM tools, or monitoring services like Datadog or New Relic.


## Load testing

Load testing is a performance testing technique that simulates concurrent user traffic to measure system behavior under various load conditions. It works by sending requests to an application at defined intervals and concurrency levels, typically ramping up from a baseline to peak load over time. Tools like k6, JMeter, or Artillery execute these test scenarios while collecting metrics about response times, error rates, and resource utilization.

During a load test, the system's components are monitored to analyze how they handle increasing demand. This includes tracking CPU and memory usage, database connection pools, network throughput, and application-specific metrics. As virtual users or requests increase, bottlenecks emerge when a component reaches its capacity - whether that's database connection limits, CPU constraints, or memory boundaries.

The data collected during load tests helps identify these performance limitations and system breaking points. For example, tests might reveal that database query times degrade after 1000 concurrent users, or that the application server's memory usage spikes when processing file uploads. This information directly informs infrastructure decisions like instance sizing, connection pool configuration, and cache settings.

By running load tests before production deployment, teams can validate their architecture choices and resource allocations. The results show exactly where performance degrades, which components need optimization, and what load levels trigger scaling events. This empirical data is essential for setting appropriate resource limits and scaling thresholds in production environments.

If you have no prior experience with with load testing, you might want to read the "Different tests for different goals" and the below cheat-sheet at https://grafana.com/docs/k6/latest/testing-guides/test-types/.

While we're running load tests in this workshop, AWS generally recommends against running load tests against their infrastructure, as it can initiate security mechanisms (https://docs.aws.amazon.com/prescriptive-guidance/latest/load-testing/welcome.html#important).
For the purpose of this workshop, we're ignoring that, since we're running the load tests with the limited resources of our home network and work machine which by far won't be enough to impact AWS infrastructure.
