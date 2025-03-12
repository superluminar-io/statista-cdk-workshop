import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Todo } from "../entities/todo";

// Fetch the repository
const todoRepository = AppDataSource.getRepository(Todo);

// Create a todo
export const createTodo = async (req: Request, res: Response) => {
  const { title, description, dueDate, status, userEmail } = req.body;

  console.log("POST /todos with body:", req.body);

  try {
    const newTodo = todoRepository.create({
      title,
      description,
      dueDate,
      status,
      userEmail,
    });
    await todoRepository.save(newTodo);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: "Failed to create todo", details: error });
  }
};

// Get all todos
export const getTodos = async (_req: Request, res: Response) => {
  console.log("GET /todos");

  try {
    const todos = await todoRepository.find();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch todos", details: error });
  }
};

// Get a specific todo by ID
export const getTodoById = async (req: Request, res: Response) => {
  const { todoId } = req.params;

  console.log("GET /todos/:todoId with todoId:", todoId);

  try {
    const todo = await todoRepository.findOneBy({ todoId });
    if (!todo) return res.status(404).json({ error: "Todo not found" });

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch todo", details: error });
  }
};

// Delete a todo
export const deleteTodo = async (req: Request, res: Response) => {
  const { todoId } = req.params;

  console.log("DELETE /todos/:todoId with todoId:", todoId);

  try {
    const result = await todoRepository.delete({ todoId });
    if (result.affected === 0)
      return res.status(404).json({ error: "Todo not found" });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete todo", details: error });
  }
};
