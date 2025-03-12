# Theory

In this lab, you will explore the sample application we'll use in this workshop.


## Docker

Docker is a platform that enables developers to package applications and their dependencies into standardized units called containers. A container is a lightweight, standalone executable package that includes everything needed to run an application: code, runtime, system tools, libraries, and settings.

Unlike traditional virtual machines which run a full operating system, containers share the host system's OS kernel and isolate only the application processes. This makes containers much more lightweight and efficient - they start up faster, use less memory and storage, and enable better resource utilization compared to VMs.

Key advantages of containers include:
- Consistency across different environments (development, testing, production)
- Isolation of applications and their dependencies
- Quick startup and deployment
- Efficient resource usage
- Easy scaling and updates

The contents of a container image are defined in `Dockerfile`s.
An example Dockerfile as found in `todo-service/Dockerfile` might look like this:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "start"]
```

It starts from a pre-existing container image `node:22-alpine` which is a container image that contains the Node.js runtime version 22 on top of the Alpine Linux operating system.

Working locally with containers and images works like this:

```sh
docker build -t todo-service .
```

This will build the container image located in the current directory and tag it as `todo-service`.

To run the created container, you can use the following command:

```sh
docker run -p 3000:3000 todo-service
```

This will run the container and map port 3000 of the container to port 3000 of your machine.


## Docker Compose

Docker Compose is a tool for defining and running multi-container Docker applications. It uses a YAML file (typically named `docker-compose.yml`) to configure all the application's services, networks, and volumes in a single file. This makes it easy to spin up an entire application stack with a single command.

Key features of Docker Compose include:

- **Service Definition**: Define multiple containers and their configurations in one file
- **Environment Management**: Easily manage environment variables and configuration across containers
- **Networking**: Automatically creates a network between your containers
- **Volume Management**: Define persistent storage volumes for your containers
- **Single Command Operations**: Start, stop, and rebuild your entire application stack with simple commands

For example, a typical Docker Compose file might define a web application service and its associated database service, ensuring they can communicate with each other and persist data appropriately. This is particularly useful for development environments where you need to run multiple interdependent services.

In essence, it's a way to manage multiple containers as a single unit, making it easier to manage complex applications.
