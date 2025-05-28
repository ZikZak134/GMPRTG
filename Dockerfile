# Use Node.js 18 slim image
FROM node:18-slim

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies (use npm install instead of npm ci)
RUN npm install --production

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Create Python virtual environment and install dependencies
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install Python dependencies if requirements.txt exists
RUN if [ -f "python-api/requirements.txt" ]; then \
    pip install --no-cache-dir -r python-api/requirements.txt; \
    fi

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
