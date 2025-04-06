FROM node:18-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    netcat-openbsd \
    libpq-dev \
    python3-dev

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
