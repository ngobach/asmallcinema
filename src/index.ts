import { toNodeListener } from 'h3';
import { createServer } from 'node:http';
import { consola } from 'consola';
import app from './app';
import { PORT, PUBLIC_URL } from './config';

const server = createServer(toNodeListener(app));

server.listen(PORT, () => {
  consola.success(`asmallcinema addon is running!`);
  consola.info(`Install Manifest URL in Stremio: ${PUBLIC_URL}/manifest.json`);
});
