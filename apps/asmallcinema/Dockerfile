FROM oven/bun:1
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN bun install --production --no-cache
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates xvfb \
    && bunx playwright install-deps chromium \
    && bunx playwright install chromium \
    && rm -rf /var/lib/apt/lists/* /root/.bun/install/cache

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . ./

EXPOSE 3005
ENV PORT=3005
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "run", "src/index.ts"]
