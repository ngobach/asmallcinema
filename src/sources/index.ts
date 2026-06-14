import { consola } from 'consola';
import { StremioStream } from '../services/streamService';
import { MovieSource, StreamRequest } from './types';
import { ceebeeSource } from './ceebee';

// List of all registered movie sources
const sources: MovieSource[] = [
  ceebeeSource
];

/**
 * Queries all registered sources in parallel, catching any errors 
 * gracefully at the source level, and aggregates the returned stream lists.
 */
export async function resolveAllStreams(req: StreamRequest): Promise<StremioStream[]> {
  const promises = sources.map(async (source) => {
    try {
      consola.info(`Querying source "${source.name}" for ${req.type}/${req.id.type}:${req.id.value}`);
      return await source.getStreams(req);
    } catch (error) {
      consola.error(`Failed to resolve streams from source "${source.name}":`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
}
