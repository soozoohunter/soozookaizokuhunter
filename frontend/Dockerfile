FROM node:18 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 改用 3001 port serve
RUN npm install -g serve

EXPOSE 3001
CMD ["serve", "-s", "build", "-l", "3001"]
