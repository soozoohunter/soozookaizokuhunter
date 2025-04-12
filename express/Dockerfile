FROM node:18-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE ${EXPRESS_PORT}

CMD ["npm","start"]
