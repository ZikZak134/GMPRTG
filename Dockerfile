# Base image for Node.js and Python
FROM node:18-slim AS base

# Install Python and required dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Setup Python environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install Node.js dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy Python requirements and install
COPY python-api/requirements.txt ./python-api/
RUN pip install --no-cache-dir -r python-api/requirements.txt

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Create data directory for Telegram session
RUN mkdir -p /app/data
VOLUME /app/data

# Copy PM2 configuration
COPY ecosystem.config.js .

# Expose ports
EXPOSE 3000
EXPOSE 5000

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
