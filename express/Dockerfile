# express/Dockerfile
FROM node:18-slim

WORKDIR /app

# 可加這行，也可不加
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
