FROM oven/bun:latest AS base

COPY ./packages/backend/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

FROM base AS dev
WORKDIR /app_dev
COPY ./package*.json .
RUN bun install

WORKDIR /app_dev/packages/lib
COPY ./packages/lib .
RUN bun install

WORKDIR /app_dev/packages/backend
COPY ./packages/backend .
RUN bun install

FROM base AS prod
WORKDIR /app
COPY ./package*.json .
RUN bun install

WORKDIR /app/packages/lib
COPY ./packages/lib .
RUN bun install

WORKDIR /app/packages/backend
COPY ./packages/backend .
RUN bun install

FROM dev AS development

FROM prod AS production