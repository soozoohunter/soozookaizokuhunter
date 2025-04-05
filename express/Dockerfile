FROM node:18-alpine
WORKDIR /app

# 只 copy package.json
COPY package.json ./

RUN npm install

# 再 copy 其他程式
COPY . ./

EXPOSE 3000
CMD ["node", "server.js"]
