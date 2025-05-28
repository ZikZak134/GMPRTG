# Use Node.js 18 Alpine for smaller size
FROM node:18-alpine

# Install dependencies for building native modules
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies (use npm install instead of npm ci)
RUN npm install --frozen-lockfile

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

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["npm", "start"]
