# express/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 先複製 package.json / package-lock.json
COPY package*.json ./
RUN npm install

# ★ 將 express/fonts 複製到 /app/fonts
COPY express/fonts /app/fonts

# 再複製剩餘的程式碼
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
