FROM node:8

COPY . /app
RUN rm -rf node_modules
RUN rm -rf jspm_modules

WORKDIR /app/server

RUN npm install

CMD ["node","index.js"]
