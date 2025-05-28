#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Telegram Parser for deployment on Fly.io...${NC}"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}flyctl is not installed. Installing...${NC}"
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Login to Fly.io if not already logged in
echo -e "${YELLOW}Checking Fly.io authentication...${NC}"
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Fly.io:${NC}"
    flyctl auth login
fi

# Create Fly.io app if it doesn't exist
APP_NAME="telegram-parser"
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo -e "${YELLOW}Creating Fly.io app: $APP_NAME${NC}"
    flyctl apps create "$APP_NAME" --org personal
else
    echo -e "${GREEN}App $APP_NAME already exists${NC}"
fi

# Create volume for persistent data if it doesn't exist
VOLUME_NAME="telegram_data"
if ! flyctl volumes list | grep -q "$VOLUME_NAME"; then
    echo -e "${YELLOW}Creating volume: $VOLUME_NAME${NC}"
    flyctl volumes create "$VOLUME_NAME" --size 1 --region ams
else
    echo -e "${GREEN}Volume $VOLUME_NAME already exists${NC}"
fi

# Set secrets from .env file if it exists
if [ -f .env ]; then
    echo -e "${YELLOW}Setting secrets from .env file...${NC}"
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # Remove quotes from value if present
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        echo -e "${GREEN}Setting secret: $key${NC}"
        flyctl secrets set "$key=$value" --app "$APP_NAME"
    done < .env
else
    echo -e "${RED}.env file not found. Please create one with your environment variables.${NC}"
    exit 1
fi

echo -e "${GREEN}Setup complete! You can now deploy with:${NC}"
echo -e "${YELLOW}flyctl deploy${NC}"
