FROM node:8

COPY . /app

WORKDIR /app

RUN npm install
RUN npm run build

WORKDIR /app/server

RUN npm install

CMD ["node","index.js"]
