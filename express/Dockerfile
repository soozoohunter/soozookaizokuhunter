# Use Node.js LTS Alpine for a lightweight image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json first for dependency installation
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Bind to all network interfaces
ENV HOST=0.0.0.0
EXPOSE 3000

# Start the Express server
CMD ["node", "index.js"]
