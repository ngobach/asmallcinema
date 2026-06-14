import { toNodeListener } from 'h3';
import { createServer } from 'node:http';
import app from './app';

// Start node HTTP server
const PORT = process.env.PORT || 3005;
const server = createServer(toNodeListener(app));
server.listen(PORT, () => {
  console.log(`🚀 asmallcinema addon is running!`);
  console.log(`👉 Install Manifest URL in Stremio: http://localhost:${PORT}/manifest.json`);
});
