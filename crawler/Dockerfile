FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY index.js ./

RUN apt-get update && apt-get install -y wget gnupg ca-certificates chromium

EXPOSE 8081
CMD ["node", "index.js"]
