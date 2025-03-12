# Hands On


## Local Load Testing

The application is now running properly and securely, so it's time to make it receive traffic.

We'll fast-forward to an unexpected hype-situation - and use load-testing to simulate the sudden high load.

To still step it up a notch, we'll not just stress-test, but break-test: We'll find the limits of what the service can handle.

There are many tools for this job. Some, like Artillery or Locust, mostly work UI based. But we'll use a simple one that supports running in docker: k6.
You can find a super short video how it works on their website: https://k6.io/open-source/

As you can see there, we first need to prepare a script of what we want to test.
[There's experimental support for typescript, but we'll stick to javascript for now.](https://grafana.com/docs/k6/latest/using-k6/javascript-typescript-compatibility-mode/#javascript-and-typescript-compatibility-mode)

Create a new file called `k6-script.js` in the `todo-service` directory and add the following code to it:

```javascript
import http from "k6/http";
import { sleep } from "k6";

export const options = {
  iterations: 10,
};

export default function () {
  http.get("http://localhost:3000/");
  sleep(1);
}
```

The script describes a single user making a request every second for 10 times.

Let's verify the load test locally first. Run the `docker compose up` command (if you want with `-d` to run in detached mode) to make the service and the database available locally.
Then, as per instructions for docker on https://grafana.com/docs/k6/latest/get-started/running-k6/#run-local-tests, the next step is to run the script with:

```sh
docker run --rm -i grafana/k6 run - < k6-script.js
# This will show only failed requests, please continue reading.
```

Whoops, we got some connection refused errors. That's because docker-compose creates a separate network for the containers, so the todo-service is not reachable from the outside - even other containers not mentioned in the `docker-compose.yml` file.
We can manually specify a network name when running `docker run`, but for that, we need to know the name of the network.
You can either scroll up in your terminal, as the name was printed out when you ran `docker compose up`, or you can find it in the `docker network ls` command.
Then we can manually specify a network for the k6 container:

```sh
docker run --rm -i --network=todo-service_default grafana/k6 run - < k6-script.js
# This will fail again, please continue reading.
```

Still no luck. That's because `localhost` in a container refers to the container itself, not our host.
We need to replace localhost with the todo-service container's address in the network created by docker-compose. Or, even better, we can use its DNS name.
Adjust the script to point to `http://todo-service:3000/` instead of `http://localhost:3000/` and run it again.

Yay! Our first load test!

For me, the whole load test took about 20 seconds to complete.

At the end of the load test output, you can see some numbers, like average response times and more. The timings should be in the milli- or microseconds range as we are running everything on our local machine.

But as it stands, we are only testing the performance of each of our machines as we didn't limit the resources the application has available yet.
Let's do that now, by adding a cpu and memory limit to the todo-service container in the `docker-compose.yml` file:

```yaml
  todo-service:
    // ...
    deploy:
      resources:
        limits:
          cpus: 0.5
          memory: 1024M
```

This limits the resources of the todo-service container to 0.5 cpu cores and 1024M memory.

The numbers are choosen more or less randomly (Although a 1:2 "ratio" of cpu cores and gigabytes memory is a good starting point in most cases). Depending on your application you might need more memory to even be able to start it.

You can also start your app without limits first, then check how much it uses when idle and go from there by doubling it or similar.

Restart the docker-composition with and wait for the service to start ("Database connected!" message in the logs).

Now, to increase the load - as 10 consecutive requests is just a small-scale smoke test to verify our app and load test is working in general - we move from `iterations` to a more sophisticated approach.
Overwrite the previous `options` in the `k6-script.js` file with the following:

```javascript
export const options = {
  // From https://grafana.com/docs/k6/latest/testing-guides/test-types/breakpoint-testing/#breakpoint-testing-in-k6
  executor: "ramping-arrival-rate", //Assure load increase if the system slows
  stages: [
    { duration: "1m", target: 10000 }, // just slowly ramp-up to a HUGE load
  ],

  // From https://grafana.com/docs/k6/latest/examples/get-started-with-k6/test-for-performance/#ramp-up-until-threshold-fails
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: true }], // http errors should be less than 1%, otherwise abort the test
    http_req_duration: ["p(99)<1000"], // 99% of requests should be below 1s
  },
};
```

This configures the load test to start at 0 parallel so-called "virtual users" and linearly increase them to 10.000 over the course of 1 minute.
As soon as 1% of the requests fail, the test is aborted.
And we also limit our request duration to roughly 1 second. If it takes longer, we consider the request failed.

Run the test again with `docker run --rm --network=todo-service_default -i grafana/k6 run - < k6-script.js`.

If you use Docker Desktop, you can see the resource usage statistics in the `Stats` tab of the todo-service container in the Docker Desktop UI.
You'll see that when the load increases, the cpu usage hits the previously set limit of 0.5 cpu cores or in docker lingo a "CPU usage of 50%".

At some point, you might see some errors in the k6 output. Don't worry about them, and let the load test run to completion. You can read more about their concrete causes on https://grafana.com/docs/k6/latest/testing-guides/running-large-tests/#common-errors if you're interested.
But the exact cause isn't relevant for us here, only that the service has a breaking point, which we reached, and that it's cpu related.

You can also take note of the requests per second (line beginning with `http_reqs` in the final output) when it finally stops, as that's the maximum load in requests per second the service can handle for the GET request to `/` with the current configuration.

Play around with different resource assignments like 1 cpu core, 0.25 cpu cores, double the memory, etc. and take note of the limits in requests per second it could handle in each configuration.
In addition, compare the cpu and memory usage to each other during the load test.

For me it was roughly these numbers:
~3000/s for 0.5cores with used memory of ~320MB
~1000/s for 0.25cores with used memory of ~250MB


## Right Sizing of Resources

Alright, let's recap what we can learn from this:

- The service has a breaking point, and it's cpu related.
- The service can handle ~3000 requests per second with 0.5 cores and ~1000 requests per second with 0.25 cores.
- The service uses ~320MB of memory with 0.5 cores and ~250MB with 0.25 cores.

A conclusion for resource right sizing might be the following:

- A 1:1 ratio of cpu cores and gigabytes of memory (like 1024MB memory per 1 cpu core) seems like a good fit, although it's not exactly linear.
  You can experiment with more resources too and see what happens to the memory usage for a whole cpu core. You then might conclude that less memory works, too.
  But keep in mind, that hitting the cpu limit only means the application becomes slower, but when it hits the memory limit, it will crash with an out-of-memory error.
  So hitting the cpu limit is always preferable to hitting the memory limit.
  Also, in cloud environments, cpu is the most expensive resource, so when you pay for it, you want to make sure you get the most out of it.
- 0.5 cpu cores is sufficient for the service to take an already huge load.

Adjust the resouce limits in the `docker-compose.yml` file to 0.5 cores and 512M memory or 1 core and 1024M memory.
What did we miss? Yes, the database.
Check the resource usage stats of the database container in the Docker Desktop UI. You might have to rerun a load test to get fresh data.

Well, the resource consumption of the database is boring to see. No matter the load, the database is more or less idle, even if there are no limits set. That's because databases automatically cache the results of the requests and only use resources when there's a cache miss or the data changed.
For this workshop, we'll skip setting resource limits for the database.

## Load Testing against AWS

Enough optimizing our local playground. Stop the local setup and mentally move to our AWS setup.

Before we apply resource changes to our AWS setup, let's see if we can run the load test against our AWS setup, too.
Change your `k6-script.js` to point to the todo-service's loadbalancer url.
You can retrieve the value from the EC2 console in AWS:

```javascript
http.get("http://<replace-me>/");
// for example: http.get('http://EcsSta-TodoS-E6IPhrBGhavh-1485234785.eu-central-1.elb.amazonaws.com/');
```

Start the load test, but remove the `--network` part. Check if you can find all of the following metrics in the AWS console in your browser:

- ECS-service metrics
- Loadbalancer metrics
- Database metrics

If you are confused by the timestamps you see, check if you can find a dropdown to change the timezone from `UTC timezone` to `Local timezone`.

You should find per-request metrics for the loadbalancer, as well as cpu and memory usage metrics for the ECS-service.
The database shows several interesting metrics, but as it's idle anyway during the load test, we won't focus on it.

For our case, the CPU and memory metrics of our ECS-service are sufficient. But if you want more information regarding the disk IO or network usage of the container in the future, you should read up on "Container Insights".

During this load test, it was only executed from our own machines, over mostly private connections and probably via wifi.
This means, the load-testing-tool itself had limited resources. Keep that in mind when running load tests in production.
It might make sense to spin up an EC2 instance with a public IP address, install the load-testing-tool there and run the tests from there.

We won't do that in this workshop though.

Instead, we'll take our gained insights and apply them to our AWS setup in the next lab.
