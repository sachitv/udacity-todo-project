import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable: string = process.env.TODOS_TABLE,
    private readonly bucketName: string = process.env.ATTACHMENTS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly s3 = new XAWS.S3({
      signatureVersion: 'v4'
    }),
    private readonly indexName: string = process.env.INDEX_NAME
  ) {}

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()
    return todoItem
  }

  async getTodos(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.indexName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()
    const items = result.Items
    return items as TodoItem[]
  }

  async deleteTodo(todoId: string, userId: string): Promise<void> {
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      })
      .promise()

    // Delete the object as well in case it exists.
    const key = GetAttachmentKey(todoId, userId)
    await this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: key
      })
      .promise()
  }

  async generateUploadUrl(todoId: string, userId: string): Promise<string> {
    const validTodoId = await this.isValidTodoId(todoId, userId)
    if (!validTodoId) {
      throw new Error('Invalid todo id')
    }

    const key = GetAttachmentKey(todoId, userId)

    const signedUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: this.urlExpiration
    })

    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`

    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        },
        ReturnValues: 'ALL_NEW'
      })
      .promise()

    return signedUrl
  }

  async updateTodo(
    todoId: string,
    userId: string,
    todoUpdate: TodoUpdate
  ): Promise<TodoItem> {
    const validTodoId = await this.isValidTodoId(todoId, userId)
    if (!validTodoId) {
      throw new Error(`Could not find a todo with the id ${todoId}`)
    }

    const result = await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        },
        UpdateExpression:
          'set #namefield = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':dueDate': todoUpdate.dueDate,
          ':done': todoUpdate.done
        },
        ExpressionAttributeNames: { '#namefield': 'name' },
        ReturnValues: 'ALL_NEW'
      })
      .promise()

    return result.Attributes as TodoItem
  }

  async isValidTodoId(todoId: string, userId: string): Promise<boolean> {
    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        }
      })
      .promise()

    return !!result.Item
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}

function GetAttachmentKey(todoId: string, userId: string) {
  return `${userId}-${todoId}`
}
