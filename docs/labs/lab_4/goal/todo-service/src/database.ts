import { DataSource } from "typeorm";
import { Todo } from "./entities/todo";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "databasestack-databasecluster68fc2945-xufnkmkhggpm.cluster-cvu4og6qcldr.eu-central-1.rds.amazonaws.com", // Replace me as necessary
  port: 5432, // Replace me as necessary
  username: "postgres", // Replace me as necessary
  password: "wmi_BuK1=HTi2vjEWAsE0_b9-v4o6_", // Replace me as necessary
  database: "postgres", // Replace me as necessary
  synchronize: true, // Auto creates tables, disable in production
  logging: false,
  entities: [Todo],
});
