FROM node:18-slim

WORKDIR /app

# 安裝依賴
COPY package.json ./
RUN npm install

COPY . .

EXPOSE ${EXPRESS_PORT}

CMD ["node", "server.js"]
