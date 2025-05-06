# kaiShield/api_service/Dockerfile

FROM node:16

# 安裝 ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . /app

EXPOSE 3000
CMD [ "node", "server.js" ]
