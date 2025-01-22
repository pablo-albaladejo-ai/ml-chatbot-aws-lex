import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoDBClient);

export const handler: APIGatewayProxyHandler = async () => {
    const tableName = process.env.MEETINGS_TABLE_NAME;
    if (!tableName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Table name not set' }),
        };
    }
    try {
        const params: QueryCommandInput = {
            TableName: tableName,
            IndexName: 'StatusIndex',
            KeyConditionExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'pending',
            },
        };

        let items: any[] = [];
        let response: QueryCommandOutput;

        do {
            response = await dynamodb.send(new QueryCommand(params));
            items = items.concat(response.Items || []);
            params.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (response.LastEvaluatedKey);

        return {
            statusCode: 200,
            body: JSON.stringify(items),
        };
    } catch (error) {
        console.error('Error querying DynamoDB:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
