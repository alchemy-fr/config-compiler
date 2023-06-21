FROM node:20.3.0-alpine3.17

WORKDIR /home/node

RUN npm install -g pkg \
    # Pre download Node.js binaries
    && touch index.js \
    && pkg --target=node18-alpine-x64 index.js \
    && rm index*

USER node

COPY --chown=node:node . .

RUN yarn install

CMD npm run compile-alpine
