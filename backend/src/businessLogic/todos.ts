import * as uuid from 'uuid'
import { TodoAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todosAccess = new TodoAccess()

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoItem: TodoItem = {
    todoId: uuid.v4(),
    createdAt: new Date().toISOString(),
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  }
  return await todosAccess.createTodo(todoItem)
}

export async function deleteTodo(
  todoId: string,
  userId: string
): Promise<void> {
  return await todosAccess.deleteTodo(todoId, userId)
}

export async function generateUploadUrl(
  todoId: string,
  userId: string
): Promise<string> {
  return await todosAccess.generateUploadUrl(todoId, userId)
}

export async function getTodos(userId: string): Promise<TodoItem[]> {
  return await todosAccess.getTodos(userId)
}

export async function updateTodo(
  todoId: string,
  userId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<TodoItem> {
  const todoUpdate: TodoUpdate = {
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  }
  return await todosAccess.updateTodo(todoId, userId, todoUpdate)
}
