FROM node:alpine

RUN mkdir -p /app
WORKDIR /app

COPY . /app

RUN npm install

CMD ["npm", "start"]
