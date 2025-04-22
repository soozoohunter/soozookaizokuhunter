FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies and build the React app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Use Nginx to serve the build artifacts
FROM nginx:stable-alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
COPY suzoo.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443
