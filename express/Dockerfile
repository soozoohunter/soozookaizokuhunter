# express/Dockerfile

FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json / package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose port (for docker-compose internal usage)
EXPOSE 3000

# Default command
CMD ["node", "server.js"]
