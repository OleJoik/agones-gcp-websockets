FROM node

WORKDIR /code

COPY package.json .
RUN npm install

COPY gameserver.js .

ENTRYPOINT [ "npm", "start" , "--"]

