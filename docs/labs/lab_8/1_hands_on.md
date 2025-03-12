# Hands On


Previously, we had the database restart and apart form a short time where it was unavailable, it worked fine.
If we would delete the only instance it has while keeping the cluster, we wouldn't ever be able to re-add a new instance, because there's no other database host it can connect to and sync data.

Therefore, it's best practice to always have at least 2 instances in a database cluster. One writer and one reader.
To add the reader, change the relevant part in the `lib/database-stack.ts` file so it looks like this:
```typescript
writer: // ... existing code
readers: [
  ClusterInstance.provisioned('dbReader', {
    instanceType: InstanceType.of(
      InstanceClass.BURSTABLE4_GRAVITON,
      InstanceSize.MEDIUM
    ),
  }),
],
```

Deploy the changes, and wait the few minutes until the new instance is created.


When the deployment is finished, check out the changes in the RDS console.

Configure the options in the `k6-script.js` file to run with low volume (`target: 1`), but with a longer `duration: 2m`.
Remove or comment out the `thresholds` section.

Make yourself familiar where to find the failover button in the RDS console and which instance is the writer.
Then start the load test again and hit said button right after.

Watch the RDS console and see if you can identify the failover moment where the reader instance is promoted to writer.
Then check the load test results and ECS-service logs to see if there was a downtime.

What do you expect to happen if you redeploy your database stack now?

Answer: If you redeploy your database stack now, you'll notice that it doesn't change anything.
That's because the instances are configured with equal instance types, so the conditions from our code are still fulfilled.
