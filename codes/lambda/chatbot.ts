import { APIGatewayProxyHandler } from 'aws-lambda';
import { LexRuntimeV2Client, RecognizeTextCommand, RecognizeTextCommandInput } from '@aws-sdk/client-lex-runtime-v2';

const lexClient = new LexRuntimeV2Client({});


export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Event:', event);
    if (process.env.BOT_ID === undefined || process.env.BOT_ALIAS_ID === undefined) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Missing environment variables' }),
        };
    }
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing request body' }),
        };
    }

    const { message } = JSON.parse(event.body);
    console.log('Message:', message);

    if (!message) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required field: message' }),
        };
    }

    try {
        const params: RecognizeTextCommandInput = {
            botId: process.env.BOT_ID,
            botAliasId: process.env.BOT_ALIAS_ID,
            localeId: 'en_US',
            sessionId: 'session-id',
            text: message,
        };
        console.log('Params:', params);

        const command = new RecognizeTextCommand(params);
        const response = await lexClient.send(command);

        const botResponse = response.messages?.[0]?.content || 'No response from bot';

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true',
            },
            body: JSON.stringify({ botResponse }),
        };
    } catch (error) {
        console.error('Error communicating with Lex:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
