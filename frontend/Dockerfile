# Stage 1: Build React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-progress
COPY . .
RUN npm run build

# Stage 2: Serve static files using serve
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve@14 && adduser -D frontend
USER frontend
COPY --from=build /app/build ./build
EXPOSE 80
CMD ["serve", "-s", "build", "-l", "80"]
