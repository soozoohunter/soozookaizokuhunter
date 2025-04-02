FROM node:18-alpine

# 若部署合約、web3 需安裝 python3 make g++ 等
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
EXPOSE 3000
CMD ["node","server.js"]
