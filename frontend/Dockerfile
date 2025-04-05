FROM node:18
WORKDIR /app

# 複製 package.json 並安裝依賴
COPY package*.json ./
RUN npm install

# 複製專案所有檔案
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
