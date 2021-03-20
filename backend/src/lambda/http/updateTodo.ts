import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
import { updateTodo } from '../../businessLogic/todos'

const logger = createLogger('updateTodos')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Got a request to update a todo item ${event}`)

    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    const updateTodoRequest: UpdateTodoRequest = JSON.parse(event.body)

    try {
      const todoItem = await updateTodo(todoId, userId, updateTodoRequest)
      return {
        statusCode: 201,
        body: JSON.stringify({
          item: todoItem
        })
      }
    } catch (error) {
      return {
        statusCode: 400,
        body: error.message
      }
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
