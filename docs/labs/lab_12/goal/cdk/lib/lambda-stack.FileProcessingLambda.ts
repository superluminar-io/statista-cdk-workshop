import { SQSEvent, SQSRecord } from 'aws-lambda';

interface Todo {
  title: string;
  description: string;
  dueDate: Date;
  status: string;
  userEmail: string;
}

export const handler = async (event: SQSEvent) => {
  const records: SQSRecord[] = event.Records;

  for (let index = 0; index < records.length; index++) {
    const body = records[index].body;
  
    const todo: Todo = JSON.parse(body);
  
    console.log(todo.dueDate);
  
    const today = new Date();
    const todoDueDate = new Date(todo.dueDate);
  
    if (todoDueDate < today) {
      // before today
      throw new Error("the due date is in the past");
    }
  }

  return;
};