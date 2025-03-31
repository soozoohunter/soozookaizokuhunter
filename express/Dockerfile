FROM node:18

WORKDIR /app

# 建議安裝 ffmpeg, 以便後端檢測影片長度 (如果要檢查"30秒"限制)
RUN apt-get update && apt-get install -y ffmpeg

COPY package*.json ./
RUN npm install

COPY server.js ./

EXPOSE 3000
CMD ["node", "server.js"]
