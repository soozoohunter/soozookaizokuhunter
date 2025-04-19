# express/Dockerfile

FROM node:18-alpine

# 建立工作目錄
WORKDIR /app

# 複製 package.json 與 package-lock.json (若有) 進容器
COPY package*.json ./

# 安裝所有依賴
RUN npm install

# 複製整個 Express 專案程式碼到容器
COPY . .

# 暴露埠 3000 (非必要，但可讀性好)
EXPOSE 3000

# 指定啟動指令 (假設主程式為 server.js)
CMD ["node", "server.js"]
