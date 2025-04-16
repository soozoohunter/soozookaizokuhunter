# express/Dockerfile

FROM node:18-alpine

WORKDIR /app

# 複製 package.json / package-lock.json 並安裝依賴
COPY package*.json ./
# 使用 --omit=dev 避免安裝 devDependencies
RUN npm install --omit=dev

# 複製整個專案源碼
COPY . .

# 對外暴露 3000 埠
EXPOSE 3000

# 指定啟動指令，假設您的主程式為 server.js
CMD ["node", "server.js"]
