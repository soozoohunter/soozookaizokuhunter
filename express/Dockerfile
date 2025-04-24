################################################
# Express + Node
################################################
FROM node:16-alpine

WORKDIR /app

# 安裝依賴
COPY package*.json ./
RUN npm install

# ★ 原本是 COPY express/fonts /app/fonts
#   若 Dockerfile 與 fonts 在同層 (即 express/Dockerfile + express/fonts)
#   就要寫 COPY ./fonts /app/fonts
COPY ./fonts /app/fonts

# 再複製其餘程式碼 (routes、models、server.js...)
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
