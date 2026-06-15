FROM oven/bun:1
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN bun install --production --no-cache
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && bunx playwright install-deps chromium \
    && bunx playwright install chromium \
    && rm -rf /var/lib/apt/lists/* /root/.bun/install/cache

COPY src tsconfig.json ./

EXPOSE 3005
ENV PORT=3005
CMD ["bun", "run", "src/index.ts"]
