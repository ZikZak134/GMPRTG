# Base image for Node.js and Python
FROM node:18-slim AS base

# Install Python and required dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Setup Python environment first
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Copy Python requirements and install
COPY python-api/requirements.txt ./python-api/
RUN pip install --no-cache-dir -r python-api/requirements.txt

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Create data directory for Telegram session
RUN mkdir -p /app/data
VOLUME /app/data

# Install PM2 globally
RUN npm install -g pm2

# Copy PM2 configuration
COPY ecosystem.config.js .

# Expose ports
EXPOSE 3000
EXPOSE 5000

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
