import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { deleteTodo } from '../../businessLogic/todos'

const logger = createLogger('deleteTodos')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Got a request to delete a todo item ${event}`)
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    await deleteTodo(todoId, userId)

    return {
      statusCode: 202,
      body: ''
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
