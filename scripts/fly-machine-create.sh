#!/bin/bash

# Create machine explicitly using Machines API
APP_NAME="prtg"

echo "Creating machine for $APP_NAME..."

# Create machine with specific configuration
flyctl machine run \
  --app "$APP_NAME" \
  --region ams \
  --vm-memory 1024 \
  --vm-cpus 1 \
  --vm-cpu-kind shared \
  --port 3000:3000/tcp:http \
  --env PORT=3000 \
  --env NODE_ENV=production \
  --env NEXT_PUBLIC_PYTHON_API_URL="https://prtg.fly.dev" \
  .

echo "Machine created successfully!"
