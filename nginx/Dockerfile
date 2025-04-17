FROM node:14 AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM nginx:latest
COPY --from=build /app/build /usr/share/nginx/html

COPY suzoo.conf /etc/nginx/conf.d/


HEALTHCHECK CMD curl -f http://localhost/ || exit 1
