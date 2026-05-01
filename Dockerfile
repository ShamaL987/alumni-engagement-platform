FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY CW2/package*.json ./

RUN npm install

COPY CW2/ .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]