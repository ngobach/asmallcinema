import { toNodeListener } from 'h3';
import { createServer } from 'node:http';
import { consola } from 'consola';
import app from './app';

// Start node HTTP server
const PORT = process.env.PORT || 3005;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

const server = createServer(toNodeListener(app));

server.listen(PORT, () => {
  consola.success(`asmallcinema addon is running!`);
  consola.info(`Install Manifest URL in Stremio: ${PUBLIC_URL}/manifest.json`);
});
