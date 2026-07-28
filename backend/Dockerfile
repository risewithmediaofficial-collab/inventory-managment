# Use official Node.js lightweight Alpine image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose port
EXPOSE 5000

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Command to run application
CMD ["node", "src/server.js"]
