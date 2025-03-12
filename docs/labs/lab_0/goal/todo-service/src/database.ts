import { DataSource } from "typeorm";
import { Todo } from "./entities/todo";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password",
  database: "postgres",
  synchronize: true, // Auto creates tables, disable in production
  logging: false,
  entities: [Todo],
});
