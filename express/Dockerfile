# ./express/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 先复制 package.json 并安装依赖
COPY package*.json ./
RUN npm install --production

# 再复制其他文件
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
