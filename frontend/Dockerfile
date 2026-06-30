FROM oven/bun:latest AS base

WORKDIR /usr/src/app

COPY package.json bun.lock* package-lock.json* pnpm-lock.yaml* yarn.lock* ./

FROM base AS development
RUN bun install --ignore-scripts
COPY . .
EXPOSE 5173
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun install --ignore-scripts
COPY . .
RUN bun run build

FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80
