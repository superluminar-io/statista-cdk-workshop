# Hands On


## Right-sizing in AWS

After finding out the limits of our ecs-service in the previous lab, we'll start with researching the available cpu and memory limits of ECS-services.
In the [CDK-docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedFargateService.html#cpu) and the [ECS-docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size) the valid values and formats for cpu and memory are described.
Sadly, the lowest ratio of cpu and memoryGB is 1:2, so we can't go lower than 512 millicores and 1024M memory, which are our current values already.

Next, the loadbalancer. Since it's a completely managed service by AWS, there's nothing to change, but also no need for it.
According to the [Application Load Balancer description](https://aws.amazon.com/elasticloadbalancing/features/#High_throughput), it can handle "millions of requests/sec".

Lastly, the database. It was idle, so let's check if we can scale it down.
First, find the currently used instance type constraints in the RDS console under the "configuration" tab of the writer instance.
Then, find the related instance type description in the `lib/database-stack.ts` file.
It's hidden beneath the `InstanceClass` and `InstanceSize` properties and doesn't explicitely state the instance type.

Try to find the Aurora Postgres instance type pricing yourself as an exercise.
Otherwise, here's the link: https://aws.amazon.com/rds/aurora/pricing/?pg=pr&loc=1
- Go to "Pricing by database instances", then expand the "Aurora PostgreSQL-compatible Edition" section.
- We're using an on-demand instance, so go to the "Provisioned On-Demand Instance" tab.
- Compare the `t3.medium` we're currently using against the `t4g.medium` price.

If we change the instance type, we save `(0,096$/h - 0,085$/h) * 24h * 30d = 7,92$/month`.
Not much, but if we would have a lot of databases, it can add up quickly.

That is the manual and fail-safe approach to right-sizing.


## AWS Compute Optimizer

There's also a tool called AWS Compute Optimizer. Open it in the AWS console and navigate to "RDS databases" on the left side.
Go to the detailed view of our database.
At first glance, there doesn't seem to be anything useful, not even the `t4g` optimization we found.
Now, enable the Graviton architecture in the "CPU architecture preference" section.

There you go!

But while it displays savings of 11% and the correct price difference, the estimated monthly savings are way lower than what we calculated.
That's because the tool takes into consideration that the database wasn't running for most of its lookback period.

For the ECS recommendations, the list might be empty for you, because it doesn't show all available services like it does for the databases, but only active recommendations.

But what's the difference between the `t3` and `t4g` instance types?

Well apart from being a generation newer, the `t4g` instances are also using the Graviton processor, which is an AWS-custom-designed ARM processor. And since it's more energy efficient, it's cheaper to run.

You might ask yourself, if it's ARM, doesn't that change the whole database engine?

Well, yes and no.
Yes, AWS has to manage that in the background somehow, but no, it doesn't affect us.
The advantages of managed databases!

Adjust the `lib/database-stack.ts` file to use the new type.

```typescript
instanceType: InstanceType.of(
  InstanceClass.BURSTABLE4_GRAVITON,
  InstanceSize.MEDIUM,
),
```

When you deploy the changes, you'll see in the RDS console that the database is not completely recreated, but modified. That's because the instance type can being modified during a database restart.
While we didn't need to recreate the database and can keep our data, a database restart still at least takes a shutdown and a startup of a database engine, so it'll take some time - roughly 10 minutes.


## Log retention

While that happens, let's take a look at the logs section of our ECS-task in the ECS console again. You'll find a button to "View in CloudWatch".
Follow the link, to see that the order of the logs is reversed (ascending instead of descending) in CloudWatch, and that you found yourself in a specific log group. Take note of its name.

Go up to the overview of log groups and in that table check out the `Retention` column for the log group you noted down.
It says `Never expire`, which means that the logs are stored indefinitely.
That doesn't sound cost efficient, does it?

Check the CloudWatch pricing and find out how much it costs to store 5GB of logs for 30 days.
Yes, that's in the free tier, but the free tier is per AWS organisation, not per account. So assume someone else already used up the free tier credits for your calculation.

If your result is somewhere around 3$, that's correct.
Again, it's not much, but also 5GBs of logs aren't that much either. And that's monthly. Forever.

To not be that wasteful, we can set a retention time for our logs.
Configure the `logRetention` property to the `logDriver` of the `ApplicationLoadBalancedFargateService` in the `lib/ecs-stack.ts` file:

```typescript
// ...
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
// ...
logDriver: new AwsLogDriver({
  streamPrefix: 'ecs/todo-service',
  logRetention: RetentionDays.ONE_MONTH,
}),
```

Deploy this change after the database modification is completed.
Then take all the log-groups of the ECS-Stack in CloudWatch and set their retention time to 1 month.
While you could apply this to all log-groups you have access to, keep in mind, that sometimes there are resources where the logs really _should_ or even _must_ be retained forever.
Those are mostly resources created during account creation.
But it's still a good idea to check them out and see their size in the detail view. If it's more than a few MBs, I recommend to reach out to your admin team.

Checking where costs come from is tedious if checking resources one by one.


## Cost Explorer

Instead of checking all possible AWS services that you might not even use yourself, you can also use the Cost Explorer tool. Navigate to the "Billing and Cost Management" section in the AWS console.

Then go to "Cost Explorer" in the sidebar navigation and first set the Date Range to "Past 7 Days" on the right side.
Set the "Granularity" to "Daily".
Then click on "Cost by service".

To make sure to exclude any credits your organisation/account might have, set the "Charge Type" to exclude "Credits".

You should now see same bar chart and can identify which AWS-Services are paid for and how much.

If you need more details, you can change the Dimenstion from "Service" to "Usage Type" and see more details for each service.

That's what should work in all AWS accounts and give a better guess on what's the cause of the costs.

If you need even more insights, ask your admin team to enable resource-level data or hourly granularity in Cost Explorer.
For most cases, that should not be necessary.


## Autoscaling

The limiting factor for the performance of our service during our load test was the cpu.
If you are close to reaching it, but still need to serve more requests, you have two options:

- Increase the resources assigned to the ECS-service. This is called vertical scaling.
- Increase the amount of ECS-tasks that run in parallel. This is called horizontal scaling.

Since it's hard to know upfront how your application will behave with all the different possible configurations and it can be quite costly to continuously test them - imagine 32 cpu cores and 64GB memory - it's recommended to keep the resources per ECS-task stable and on the lower side and instead do horizontal scaling by adding more parallel ECS-tasks.

As you already have metrics like cpu and memory usage, they can already be used as condition to scale up or down.
That's where autoscaling comes in.

Add the following lines to the end of the constructor of the `EcsStack` in the `lib/ecs-stack.ts` file:

```typescript
const scaling = albFargateService.service.autoScaleTaskCount({
  minCapacity: 2,
  maxCapacity: 10,
});

scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 60,
  scaleInCooldown: cdk.Duration.seconds(60),
  scaleOutCooldown: cdk.Duration.seconds(60),
});

scaling.scaleOnMemoryUtilization('MemoryScaling', {
  targetUtilizationPercent: 60,
  scaleInCooldown: cdk.Duration.seconds(60),
  scaleOutCooldown: cdk.Duration.seconds(60),
});
```

With this configuration, the ecs-service will scale up and down as per conditions, but always between 2 and 10 ECS-tasks.
2 as lower limit, so there's always redundancy in case something fails in a single instance and a new one has to be started.
10 as upper limit, because we don't want to increase our bill too much - at least not without warning and manual intervention.

We're letting AWS scale based on average cpu and memory utilization over all ECS-tasks, with an average target utilization of 60%.
If it's higher for 60 seconds, it'll scale up, if it's lower for 60 seconds, it'll scale down.

For high-load services where you already know how much requests you'll get, it's recommended to also set the initial `desiredCount` to a higher value, so the service is already scaled out when it's deployed and scales down as needed.
To make sure the service is highly available, it's recommended to always have at least 2 ECS-tasks running in parallel, independent of the autoscaling configuration.

Change the `desiredCount` to 2 in the constructor of the `EcsStack` in the `lib/ecs-stack.ts` file:

```typescript
const albFargateService = new ApplicationLoadBalancedFargateService(
  this,
  'TodoService',
  {
    // ...
    desiredCount: 2,
    // ...
  }
);
```

Deploy these changes and check the ECS console again.

If you'd now run a load test for longer than one minute without setting a failure threshold, you'd observe the number of tasks automatically scaling up in response to the increased load.
