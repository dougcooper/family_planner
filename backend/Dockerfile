FROM node:20-alpine

# Install PostgreSQL client for migrations
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Make scripts executable
RUN chmod +x /app/scripts/*.sh

# Expose port
EXPOSE 3000

# Start application with migrations
CMD ["/app/scripts/entrypoint.sh"]
