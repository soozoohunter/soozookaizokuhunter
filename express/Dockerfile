FROM node:16

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./

# 建立uploads目錄並賦予node使用者權限
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# 切換至node使用者
USER node

EXPOSE 3000
CMD ["node", "server.js"]
