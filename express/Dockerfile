FROM node:18-slim

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .  # 複製 server.js, db.js, etc.

EXPOSE 3000
CMD ["node", "server.js"]
