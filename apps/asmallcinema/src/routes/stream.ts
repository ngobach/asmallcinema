import { defineEventHandler } from 'h3';
import { consola } from 'consola';
import { getStreams } from '../services/streamService';
import { parseStreamRequest } from '../sources/types';

export default defineEventHandler(async (event) => {
  const type = event.context.params?.type;
  let id = event.context.params?.id;

  // Stremio passes ID as "tt0111161.json". We strip the extension to get the clean ID.
  if (id && id.endsWith('.json')) {
    id = id.slice(0, -5);
  }

  consola.info(`Received stream request for type: ${type}, id: ${id}`);

  if (type && id) {
    const req = parseStreamRequest(type, id);
    if (req) {
      const streams = await getStreams(req);
      return { streams };
    }
  }

  // Fallback empty list
  return { streams: [] };
});
