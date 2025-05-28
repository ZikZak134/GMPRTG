#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

APP_NAME="prtg"

echo -e "${YELLOW}Setting up Fly.io app with Machines API...${NC}"

# Check if app exists
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo -e "${YELLOW}Creating app: $APP_NAME${NC}"
    flyctl apps create "$APP_NAME" --org personal
else
    echo -e "${GREEN}App $APP_NAME already exists${NC}"
fi

# Allocate IP address
echo -e "${YELLOW}Allocating IP address...${NC}"
flyctl ips allocate-v4 --app "$APP_NAME"
flyctl ips allocate-v6 --app "$APP_NAME"

# Set secrets
echo -e "${YELLOW}Setting environment variables...${NC}"
flyctl secrets set NEXT_PUBLIC_PYTHON_API_URL="https://prtg.fly.dev" --app "$APP_NAME"

# Deploy with explicit machine configuration
echo -e "${YELLOW}Deploying with machine configuration...${NC}"
flyctl deploy --app "$APP_NAME" --strategy immediate

# Check status
echo -e "${YELLOW}Checking deployment status...${NC}"
flyctl status --app "$APP_NAME"

# Show logs
echo -e "${YELLOW}Recent logs:${NC}"
flyctl logs --app "$APP_NAME"

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Your app should be available at: https://$APP_NAME.fly.dev${NC}"
