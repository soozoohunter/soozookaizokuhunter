# soozookaizokuhunter/crawler/Dockerfile

FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY index.js ./

# 安裝 chromium + 字型
RUN apt-get update && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf

EXPOSE 8081
CMD ["node", "index.js"]
