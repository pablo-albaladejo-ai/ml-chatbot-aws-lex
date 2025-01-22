#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status.

# Configuration File Path
export APP_CONFIG=$1

USER_EMAIL=$(cat $APP_CONFIG | jq -r '.Project.UserEmail')
export AWS_PROFILE=$(cat $APP_CONFIG | jq -r '.Project.Profile')

# Set the AWS profile
AWS_REGION=$(aws configure get region)
echo "AWS Region: $AWS_REGION"

# Deploy the backend stack
echo "Deploying backend stack..."
cdk deploy BackendStack -c userEmail=$USER_EMAIL --outputs-file backend-outputs.json

# Get the backend values
API_URL=$(jq -r '.BackendStack.ApiGatewayUrl' backend-outputs.json | sed 's:/$::')
COGNITO_USER_POOL_ID=$(jq -r '.BackendStack.CognitoUserPoolId' backend-outputs.json)
COGNITO_APP_CLIENT_ID=$(jq -r '.BackendStack.CognitoUserPoolClientId' backend-outputs.json)

# Verify that the values are not empty
if [ -z "$API_URL" ] || [ -z "$COGNITO_USER_POOL_ID" ] || [ -z "$COGNITO_APP_CLIENT_ID" ]; then
    echo "Error: Could not retrieve values from the backend stack."
    exit 1
fi

echo "Backend stack deployed successfully:"
echo "API URL: $API_URL"
echo "Cognito User Pool ID: $COGNITO_USER_POOL_ID"
echo "Cognito App Client ID: $COGNITO_APP_CLIENT_ID"

# Create the configuration file for the frontend
echo "Creating frontend configuration..."
cat > codes/frontend/.env.production <<EOL
VITE_API_URL=$API_URL
VITE_AWS_PROJECT_REGION=$AWS_REGION
VITE_AWS_COGNITO_REGION=$AWS_REGION
VITE_AWS_USER_POOLS_ID=$COGNITO_USER_POOL_ID
VITE_AWS_USER_POOLS_WEB_CLIENT_ID=$COGNITO_APP_CLIENT_ID
EOL

# Build and deploy the frontend
echo "Building and deploying frontend..."
cd codes/frontend
npm install
npm run build
cd ../..

# Deploy the frontend stack
echo "Deploying frontend stack..."
cdk deploy FrontendStack --outputs-file frontend-outputs.json

echo "Deployment completed successfully."
