import { DataSource } from "typeorm";
import { Todo } from "./entities/todo";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // Auto creates tables, disable in production
  logging: false,
  entities: [Todo],
  cache: {
    type: "redis",
    options: {
      socket: {
        host: process.env.REDIS_ENDPOINT,
        tls: process.env.REDIS_ENDPOINT !== "redis", // Disable TLS for local development
        connectTimeout: 100, // 100ms
      },
    },
  },
});
