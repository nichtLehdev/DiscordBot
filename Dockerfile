FROM node:current-alpine3.18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY ./dist .

EXPOSE 80
CMD [ "node", "server.js" ]