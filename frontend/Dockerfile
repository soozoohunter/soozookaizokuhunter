# Stage 1: Build React app
FROM node:18 as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY public public
COPY src src
RUN npm run build

# Stage 2: Setup Nginx to serve frontend and act as reverse proxy
FROM nginx:1.21-alpine

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build artifacts from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
