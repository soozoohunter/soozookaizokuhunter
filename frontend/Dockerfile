FROM node:18-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# build 靜態檔
RUN npm run build

# 安裝serve (若不需要可移除)
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
