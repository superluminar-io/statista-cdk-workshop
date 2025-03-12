# Hands On

## Run Database container on localhost

To run a database on your local machine, we'll leverage a docker container. Docker itself would require a command line command like `docker run -d -p 5432:5432 postgres` to run the database.
Since that's lengthy, and annoying to type or copy paste, we'll use the `docker-compose.yml` file to run the database.

Check out the `todo-service/docker-compose.yml` file to see the database configuration and start the database on your local machine by running `docker compose up`.

## Run Todo Service on localhost

As you can see, the credentials for the database are set in the `docker-compose.yml` file.

Open the `todo-service/src/database.ts` file and make sure the database configuration matches those credentials.

Then, check out the `todo-service/README.md` and run the app on your local machine.
Feel free to play around with its API.

Make sure to stop the application after you're done.


## Run Todo Service in a container

Check out the `Dockerfile` for the `todo-service` folder. The file has no extension.

Try to understand what the instructions in the file are doing.

The Dockerfile:
1. Uses Node.js 22 with Alpine Linux as base image.
2. Sets the working directory within the container to `/app`.
3. Copies the application files from the same folder to the container
4. Installs dependencies as described in the `package.json` file.
5. Configures the app startup for when the container starts.

We could use a `docker run ...` command to start the container, but we'll extend the existing `docker-compose.yml` file instead.

Add the following block to the `docker-compose.yml` file:

```yaml
  todo-service:
    build:
      context: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
```

This makes sure that the `todo-service` container is built from the Dockerfile in the same folder and started after the `postgres` container is started.
The application will be exposed on localhost port 3000 - which is the same as before.

Then, run `docker compose up` to start the `todo-service` container while keeping the database container running.

Is the application still reachable and working as expected?

After you verified the success of the previous step, stop the containers by pressing `Ctrl+C` in the terminal where you ran `docker compose up`.
