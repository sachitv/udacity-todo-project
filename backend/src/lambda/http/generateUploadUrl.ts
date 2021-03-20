import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { generateUploadUrl } from '../../businessLogic/todos'

const logger = createLogger('generateUploadUrl')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Got a request to generate an upload url ${event}`)
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    try {
      const signedUrl = await generateUploadUrl(todoId, userId)
      return {
        statusCode: 200,
        body: JSON.stringify({
          uploadUrl: signedUrl
        })
      }
    } catch (error) {
      logger.error(`Encountered an error ${error}`)
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
