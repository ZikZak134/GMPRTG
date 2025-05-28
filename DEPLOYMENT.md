# Deployment Guide for Telegram Channel Parser

This guide explains how to deploy the Telegram Channel Parser application to Fly.io.

## Prerequisites

1. A GitHub account
2. A Fly.io account
3. The Fly.io CLI installed locally (optional for manual deployments)

## Automatic Deployment with GitHub Actions

The project is configured to automatically deploy to Fly.io whenever changes are pushed to the `main` branch.

### Setup

1. **Add FLY_API_TOKEN to GitHub Secrets**:
   - Get your Fly.io API token by running `flyctl auth token` in your terminal
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `FLY_API_TOKEN`
   - Value: Your Fly.io API token
   - Click "Add secret"

2. **Initial Setup**:
   - Clone the repository
   - Run `chmod +x scripts/setup.sh`
   - Run `./scripts/setup.sh` to create the Fly.io app and set up environment variables

3. **Push to Main Branch**:
   - Any push to the `main` branch will trigger a deployment

## Manual Deployment

If you prefer to deploy manually:

1. **Install Fly.io CLI**:
   \`\`\`bash
   curl -L https://fly.io/install.sh | sh
   \`\`\`

2. **Login to Fly.io**:
   \`\`\`bash
   flyctl auth login
   \`\`\`

3. **Deploy the Application**:
   \`\`\`bash
   ./scripts/deploy.sh
   \`\`\`

## Environment Variables

The following environment variables are required:

- `API_ID`: Telegram API ID
- `API_HASH`: Telegram API Hash
- `TELEGRAM_SESSION`: Telegram session string
- `PYTHON_API_PORT`: Port for the Python API (default: 5000)
- `NEXT_PUBLIC_PYTHON_API_URL`: URL for the Python API (default: http://localhost:5000)

## Monitoring and Logs

- **View Logs**:
  \`\`\`bash
  flyctl logs --app telegram-parser
  \`\`\`

- **Check Status**:
  \`\`\`bash
  flyctl status --app telegram-parser
  \`\`\`

- **Open the Application**:
  \`\`\`bash
  flyctl open --app telegram-parser
  \`\`\`

## Troubleshooting

- **Check Health Endpoint**: Visit `/api/health` to check the status of both the Next.js and Python API services
- **Restart the Application**: `flyctl apps restart telegram-parser`
- **SSH into the VM**: `flyctl ssh console --app telegram-parser`
