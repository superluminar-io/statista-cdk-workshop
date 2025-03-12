# Todo Service

This service is responsible for managing todos.

## Usage

To start the service, run the following commands:

```
npm install
npm run start
```

You can make manual requests to the service using `curl` or `Postman`:

```
# Initial test
curl http://localhost:3000

# Get all todos
curl http://localhost:3000/todos
# or
curl -s http://localhost:3000/todos | jq .

# Create a todo
curl -X POST -H "Content-Type: application/json" -d '{
    "title": "First Todo",
    "description": "This is my first todo",
    "dueDate": "2025-02-06",
    "status": "pending",
    "userEmail": "till.hoffmann@superluminar.io"
}' http://localhost:3000/todos
```

## Routes

- `POST /todos`: Create a new todo
- `GET /todos`: Get all todos
- `GET /todos/:todoId`: Get a todo by ID
- `DELETE /todos/:todoId`: Delete a todo by ID

## Architecture

The service takes requests and manages todo data in a postgres database.
The database url is set in the `src/database.ts` file.
