FROM node:18-alpine

WORKDIR /app

# 添加編譯工具 (安裝後可刪除以減小鏡像大小)
RUN apk add --no-cache python3 make g++  # <--- 新增此行

COPY package*.json ./
RUN npm install --production

# 可選：移除不再需要的編譯工具（根據實際需求）
RUN apk del python3 make g++  # <--- 若某些依賴需要保留工具則不要刪除

COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
