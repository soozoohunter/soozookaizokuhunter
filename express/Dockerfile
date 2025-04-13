# express/Dockerfile
FROM node:18-slim

WORKDIR /app

# 安裝系統套件(如需)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
