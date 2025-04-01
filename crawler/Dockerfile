FROM node:18-alpine

RUN apk add --no-cache curl bash chromium chromium-chromedriver \
    nss freetype harfbuzz ca-certificates ttf-freefont

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
EXPOSE 8081
CMD ["node","index.js"]
