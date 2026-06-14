import { createApp, createRouter, defineEventHandler, handleCors, sendRedirect } from 'h3';
import manifestRoute from './routes/manifest';
import streamRoute from './routes/stream';

const app = createApp();

// Global middleware to handle CORS for Stremio web app clients
app.use(defineEventHandler((event) => {
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

// Redirect root to manifest
router.get('/', defineEventHandler((event) => {
  return sendRedirect(event, '/manifest.json', 302);
}));

// Register Stremio Addon routes
router.get('/manifest.json', manifestRoute);
router.get('/stream/:type/:id', streamRoute);

app.use(router);

export default app;
