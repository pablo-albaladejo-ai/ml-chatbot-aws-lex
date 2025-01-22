import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoDBClient);

export const handler: APIGatewayProxyHandler = async (event) => {
    const tableName = process.env.MEETINGS_TABLE_NAME;
    if (!tableName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Table name not set' }),
        };
    }
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing request body' }),
        };
    }

    const { meetingId, newStatus } = JSON.parse(event.body);

    if (!meetingId || !newStatus) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required fields: meetingId or newStatus' }),
        };
    }

    try {
        const params: UpdateCommandInput = {
            TableName: tableName,
            Key: { meetingId },
            UpdateExpression: 'SET #status = :newStatus',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':newStatus': newStatus,
            },
            ReturnValues: 'ALL_NEW',
        };

        const result: UpdateCommandOutput = await dynamodb.send(new UpdateCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Status successfully changed', updatedItem: result.Attributes }),
        };
    } catch (error) {
        console.error('Error updating DynamoDB:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
