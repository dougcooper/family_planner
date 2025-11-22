FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN rm -f package-lock.json
RUN npm install --legacy-peer-deps

# Fix for ajv resolution issue
RUN echo "module.exports = require('./codegen/index');" > node_modules/ajv/dist/compile/codegen.js

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start Expo web server
CMD ["npm", "run", "web", "--", "--port", "8080"]
