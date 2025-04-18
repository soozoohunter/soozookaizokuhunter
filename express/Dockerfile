FROM node:18

WORKDIR /app

# 先複製 package*.json，以安裝依賴
COPY package*.json ./

RUN npm install

# 再複製整個 express 原始碼
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
