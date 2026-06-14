import { createApp, createRouter, defineEventHandler, setHeader } from 'h3';
import manifestRoute from './routes/manifest';
import streamRoute from './routes/stream';

const app = createApp();

// Global middleware to handle CORS for Stremio web app clients
app.use(defineEventHandler((event) => {
  setHeader(event, 'Access-Control-Allow-Origin', '*');
  setHeader(event, 'Access-Control-Allow-Headers', '*');
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (event.node.req.method === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return '';
  }
}));

const router = createRouter();

// Register Stremio Addon routes
router.get('/manifest.json', manifestRoute);
router.get('/stream/:type/:id', streamRoute);

app.use(router);

export default app;
