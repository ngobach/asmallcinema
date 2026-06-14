import { toNodeListener } from 'h3';
import { createServer } from 'node:http';
import { consola } from 'consola';
import app from './app';
import { PORT, PUBLIC_URL } from './config';
import { manifest } from './manifest';

const server = createServer(toNodeListener(app));

server.listen(PORT, () => {
  consola.success(`${manifest.name} addon is running!`);
  consola.info(`Install Manifest URL in Stremio: ${PUBLIC_URL}/manifest.json`);
});
