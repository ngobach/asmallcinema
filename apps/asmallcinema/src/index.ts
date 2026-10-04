import { toNodeListener } from 'h3';
import { createServer } from 'node:http';
import { consola } from 'consola';
import app from './app';
import { PORT, PUBLIC_URL, TMDB_API_KEY } from './config';
import { manifest } from './manifest';
import { closeBrowser, getBrowserContext } from './utils/browser';
import { closeCdpBrowser } from './utils/cdpBrowser';

// Launch the shared Playwright browser context once at startup
await getBrowserContext();

if (!TMDB_API_KEY) {
  consola.warn('TMDB_API_KEY is not set. IMDb IDs cannot be resolved to TMDB IDs.');
}

const server = createServer(toNodeListener(app));

server.listen(PORT, () => {
  consola.success(`${manifest.name} addon is running!`);
  consola.info(`Install Manifest URL in Stremio: ${PUBLIC_URL}/manifest.json`);
});

// Gracefully close the shared browsers on shutdown
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    consola.info(`Received ${signal}, shutting down...`);
    await Promise.all([closeBrowser(), closeCdpBrowser()]);
    server.close(() => process.exit(0));
  });
}
