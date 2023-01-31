FROM node:lts as build

RUN npm install -g npm@latest && \
    npm install -g pnpm@latest

WORKDIR /build

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:lts

RUN npm install -g npm@latest && \
    npm install -g pnpm@latest && \
    mkdir -pv /app && \
    chown node:node -R /app

WORKDIR /app


COPY --from=build --chown=node:node /build/package.json /app/package.json
COPY --from=build --chown=node:node /build/pnpm-lock.yaml /app/pnpm-lock.yaml

RUN pnpm install -P

COPY --from=build --chown=node:node /build/dist/ /app/dist/

USER node

ENTRYPOINT ["pnpm", "run", "start"]
