# express/Dockerfile

FROM node:18-slim

WORKDIR /app

# 複製 package.json, package-lock.json (若有)
COPY package*.json ./

RUN npm install

# 複製其餘程式碼 (server.js, db.js, etc.)
COPY . .

# 若原本一行是: COPY . .  # 複製 server.js, db.js, ...
# 請拆成兩行，避免 Docker parser 把 # 當成指令的一部分

EXPOSE 3000

CMD ["node", "server.js"]
