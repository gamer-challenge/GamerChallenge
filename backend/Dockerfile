FROM oven/bun:latest AS base

WORKDIR /usr/src/app

COPY package.json bun.lock ./

FROM base AS development
RUN bun install --ignore-scripts
COPY . .
EXPOSE 3000
CMD ["bun", "run", "docker:dev"]

FROM base AS production
RUN bun install --production --ignore-scripts
COPY . .
EXPOSE 3000
CMD ["bun", "run", "start"]
