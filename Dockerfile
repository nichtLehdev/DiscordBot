FROM node:current-alpine3.18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY ./dist .
COPY ./.env ./.env

EXPOSE 29420
CMD [ "node", "server/server.js" ]
