#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status.

# Configuration File Path
export APP_CONFIG=$1

USER_EMAIL=$(cat $APP_CONFIG | jq -r '.Project.UserEmail')
export AWS_PROFILE=$(cat $APP_CONFIG | jq -r '.Project.Profile')

# Set the AWS profile
AWS_REGION=$(aws configure get region)
echo "AWS Region: $AWS_REGION"

# Synth backend stack
echo "Synthesizing backend stack..."
cdk synth BackendStack -c userEmail=$USER_EMAIL > backend-template.yaml

if [ $? -eq 0 ]; then
    echo "Backend stack synthesized successfully: backend-template.yaml"
else
    echo "Error: Backend stack synth failed."
    exit 1
fi

# Synth frontend stack
echo "Synthesizing frontend stack..."
cdk synth FrontendStack > frontend-template.yaml

if [ $? -eq 0 ]; then
    echo "Frontend stack synthesized successfully: frontend-template.yaml"
else
    echo "Error: Frontend stack synth failed."
    exit 1
fi

echo "Synth process completed successfully."
