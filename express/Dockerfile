# express/Dockerfile
FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*


COPY package*.json ./


RUN npm install --production


COPY . .

EXPOSE 3000

CMD ["npm", "start"]
