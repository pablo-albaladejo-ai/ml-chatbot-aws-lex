import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

import { APIGatewayProxyHandler } from 'aws-lambda';

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
    const queryParams = event.queryStringParameters || {};
    const startDateStr = queryParams.startDate;
    const endDateStr = queryParams.endDate;

    if (!startDateStr || !endDateStr) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required query parameters: startDate or endDate' }),
        };
    }

    try {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const params: QueryCommandInput = {
            TableName: tableName,
            IndexName: 'StatusIndex',
            KeyConditionExpression: '#status = :status AND #date BETWEEN :startDate AND :endDate',
            ExpressionAttributeNames: {
                '#status': 'status',
                '#date': 'date',
            },
            ExpressionAttributeValues: {
                ':status': 'approved',
                ':startDate': startDate.toISOString(),
                ':endDate': endDate.toISOString(),
            },
        };

        let items: any[] = [];
        let response;

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
