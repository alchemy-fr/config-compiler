FROM node:10.18.0-alpine3.11

WORKDIR /home/node

RUN npm install -g pkg \
    # Pre download Node.js binaries
    && touch index.js \
    && pkg --target=node10-alpine-x64 index.js \
    && rm index*

USER node

CMD npm run compile-alpine
