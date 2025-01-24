#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status.

# Configuration File Path
export APP_CONFIG=$1
echo "Using configuration file: $APP_CONFIG"

export AWS_PROFILE=$(cat $APP_CONFIG | jq -r '.aws.profile')
export AWS_REGION=$(cat $APP_CONFIG | jq -r '.aws.region')
PREFIX=$(cat $APP_CONFIG | jq -r '.app.name')

# Synth backend stack
echo "Synthesizing backend stack..."
cdk synth "${PREFIX}BackendStack" -c configFilePath=$APP_CONFIG > backend-template.yaml

if [ $? -eq 0 ]; then
    echo "Backend stack synthesized successfully: backend-template.yaml"
else
    echo "Error: Backend stack synth failed."
    exit 1
fi

# Synth frontend stack
echo "Synthesizing frontend stack..."
cdk synth "${PREFIX}FrontendStack" -c configFilePath=$APP_CONFIG > frontend-template.yaml

if [ $? -eq 0 ]; then
    echo "Frontend stack synthesized successfully: frontend-template.yaml"
else
    echo "Error: Frontend stack synth failed."
    exit 1
fi

echo "Synth process completed successfully."
