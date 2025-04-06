FROM node:18-slim

WORKDIR /app

COPY package.json ./
RUN apt-get update && apt-get install -y python3 build-essential && \
    npm install && \
    apt-get remove -y python3 build-essential && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 3000
CMD ["node","server.js"]
