import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoDBClient);

interface IntentRequest {
  sessionState: {
    sessionAttributes?: Record<string, string>;
    intent: {
      name: string;
      slots: Record<string, { value: { interpretedValue: string } } | null>;
      state: string;
    };
  };
  sessionId: string;
  requestAttributes?: Record<string, string>;
}

// Helper to get session attributes
const getSessionAttributes = (intentRequest: IntentRequest): Record<string, string> => {
  return intentRequest.sessionState.sessionAttributes || {};
};

// Helper to get all slots
const getSlots = (intentRequest: IntentRequest) => {
  return intentRequest.sessionState.intent.slots;
};

// Helper to get a specific slot
const getSlot = (intentRequest: IntentRequest, slotName: string): string | null => {
  const slots = getSlots(intentRequest);
  return slots && slots[slotName] && slots[slotName]?.value?.interpretedValue || null;
};

// Helper to close the conversation
const close = (
  intentRequest: IntentRequest,
  sessionAttributes: Record<string, string>,
  fulfillmentState: string,
  message: { contentType: string; content: string }
) => {
  intentRequest.sessionState.intent.state = fulfillmentState;
  return {
    sessionState: {
      sessionAttributes,
      dialogAction: {
        type: 'Close',
      },
      intent: intentRequest.sessionState.intent,
    },
    messages: [message],
    sessionId: intentRequest.sessionId,
    requestAttributes: intentRequest.requestAttributes || null,
  };
};

// Helper to calculate end time
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const end = new Date(0, 0, 0, hours, minutes + durationMinutes);
  return end.toTimeString().slice(0, 5); // Return HH:mm
};

// Check if the meeting slot is available
const checkMeetingSlot = async (proposedDate: string, proposedStartTime: string, duration: number, tableName: string): Promise<boolean> => {
  const endTime = calculateEndTime(proposedStartTime, duration);
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: 'StatusIndex',
    KeyConditionExpression: '#status = :status AND #date = :date',
    FilterExpression:
      '(#startTime > :proposedStartTime AND #startTime < :endTime) OR ' +
      '#startTime = :proposedStartTime OR ' +
      '(#endTime > :proposedStartTime AND #endTime < :endTime)',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#date': 'date',
      '#startTime': 'startTime',
      '#endTime': 'endTime',
    },
    ExpressionAttributeValues: {
      ':status': 'approved',
      ':date': proposedDate, 
      ':proposedStartTime': proposedStartTime,
      ':endTime': endTime,
    },
  });

  const response = await dynamodb.send(command);

  return response.Items?.length === 0; // True if no conflicts
};

// Create meeting logic
const createMeeting = async (intentRequest: IntentRequest, tableName: string) => {
  const sessionAttributes = getSessionAttributes(intentRequest);
  const proposedDate = getSlot(intentRequest, 'MeetingDate');
  const proposedStartTime = getSlot(intentRequest, 'MeetingTime');
  const proposedDuration = parseInt(getSlot(intentRequest, 'MeetingDuration') || '0', 10);
  const email = getSlot(intentRequest, 'AttendeeEmail');
  const name = getSlot(intentRequest, 'FullName');
  const meetingId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const proposedEndTime = calculateEndTime(proposedStartTime || '', proposedDuration);
  const isConflict = !(await checkMeetingSlot(proposedDate || '', proposedStartTime || '', proposedDuration, tableName));

  const item = {
    meetingId,
    attendeeName: name,
    email,
    date: proposedDate,
    duration: proposedDuration,
    startTime: proposedStartTime,
    endTime: proposedEndTime,
    status: 'pending',
    isConflict,
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await dynamodb.send(command);

  const message = {
    contentType: 'PlainText',
    content: `Thank you ${name}. Your meeting request for ${proposedDate} from ${proposedStartTime} to ${proposedEndTime} has been created. Have a nice day!`,
  };

  return close(intentRequest, sessionAttributes, 'Fulfilled', message);
};

// Main handler logic
const handleRequest = async (intentRequest: IntentRequest, tableName: string) => {
  const intentName = intentRequest.sessionState.intent.name;

  switch (intentName) {
    case 'BookMeeting':
      return await createMeeting(intentRequest, tableName);
    default:
      return null;
  }
};

// Lambda handler
export const handler = async (event: IntentRequest) => {
  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    throw new Error('Table name is not set');
  }
  return await handleRequest(event, tableName);
};
