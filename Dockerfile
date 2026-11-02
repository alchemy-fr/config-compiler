FROM node:26.13.0-alpine3.24 AS build

WORKDIR /home/node

USER node

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci --ignore-scripts

COPY --chown=node:node index.js ./

RUN npm run compile-alpine

FROM scratch AS export

COPY --from=build /home/node/build/generate-env-alpine /
