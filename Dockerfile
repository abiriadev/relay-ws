# build stage
FROM node:20.2.0 AS builder
WORKDIR /usr/src/app

# install dependencies
COPY ./package.json ./pnpm-lock.yaml ./
RUN ["corepack", "enable"]
RUN ["pnpm", "install", "--frozen-lockfile"]

# copy source
COPY . .

# build package
RUN ["pnpm", "run", "build"]

# package codebase
RUN ["pnpm", "prune", "--prod"]
RUN ["./scripts/pack.sh"]

# run stage
FROM node:20.2.0-alpine3.17 AS runner
WORKDIR /home/node/app

# production setup
USER node
ENV NODE_ENV production

# labels
EXPOSE 34098
LABEL org.opencontainers.image.authors="Abiria <abiria.dev@gmail.com>"
LABEL org.opencontainers.image.url="https://github.com/abiriadev/relay-ws"
LABEL org.opencontainers.image.source="https://github.com/abiriadev/relay-ws"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="Relay WS"

# copy packaged codebase
COPY --from=builder /usr/src/app/pack/ .

# run server
CMD ["node", "./dist/index.js"]
