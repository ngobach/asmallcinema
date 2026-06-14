import { createApp, createRouter, defineEventHandler, handleCors } from 'h3';
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

// Register Stremio Addon routes
router.get('/manifest.json', manifestRoute);
router.get('/stream/:type/:id', streamRoute);

app.use(router);

export default app;
