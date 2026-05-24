FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "node wait-for-backend.js backend 8081 && npm run dev -- --hostname 0.0.0.0"]
