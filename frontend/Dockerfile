########################
# 1) Builder Stage
########################
FROM node:16-alpine AS builder

WORKDIR /app

# 鎖定 jwt-decode 版本（若您需要）
COPY package*.json ./
RUN npm install jwt-decode@4.0.0
RUN npm install

COPY . .
RUN npm run build

########################
# 2) Production Stage
########################
FROM node:16-alpine AS production
RUN npm install -g serve

WORKDIR /app
COPY --from=builder /app/build ./build

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
