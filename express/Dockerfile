FROM node:18-alpine

# 安裝必要套件 (curl, bash 等)
RUN apk add --no-cache python3 make g++ curl bash

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
