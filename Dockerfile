FROM oven/bun:1 AS base
WORKDIR /usr/src/app
COPY package.json bun.lockb .env ./
RUN bun install --frozen-lockfile && mv node_modules ../
RUN ls -la /usr/src/app
COPY . .
RUN chown -R bun /usr/src/app
USER bun
CMD ["bun", "run", "start"]
