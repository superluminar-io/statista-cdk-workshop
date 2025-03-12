import { RequestHandler, Router } from "express";
import {
  createTodo,
  getTodos,
  getTodoById,
  deleteTodo,
} from "../controllers/todoController";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.get("/health", (req, res) => {
  res.send("ok");
});

router.post("/todos", createTodo);
router.get("/todos", getTodos as RequestHandler);
router.get("/todos/:todoId", getTodoById as RequestHandler);
router.delete("/todos/:todoId", deleteTodo as RequestHandler);

export default router;
