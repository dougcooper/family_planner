FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start Expo web server
CMD ["npm", "run", "web", "--", "--port", "8080"]
