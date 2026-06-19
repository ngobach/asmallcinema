import { createApp, createRouter, defineEventHandler, handleCors, sendRedirect } from 'h3';
import { consola } from 'consola';
import manifestRoute from './routes/manifest';
import streamRoute from './routes/stream';
import proxyRoute from './routes/proxy';
import { ADDON_HOME_PAGE } from './config';

const app = createApp();

// Global middleware to handle CORS for Stremio web app clients
app.use(defineEventHandler((event) => {
  consola.debug(`[Server] Request path: ${event.path}`);
  const cors = handleCors(event, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['*']
  });
  if (cors) {
    return cors;
  }
}));

const router = createRouter();

// Redirect root to addon's home page
router.get('/', defineEventHandler((event) => {
  return sendRedirect(event, ADDON_HOME_PAGE, 302);
}));

// Register Stremio Addon routes
router.get('/manifest.json', manifestRoute);
router.get('/stream/:type/:id', streamRoute);
router.add('/m3u8-proxy', proxyRoute);

app.use(router);

export default app;
