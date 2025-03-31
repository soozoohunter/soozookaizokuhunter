# crawler/Dockerfile
FROM node:18

WORKDIR /app

RUN apt-get update && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY index.js ./

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 8081
CMD ["node", "index.js"]
