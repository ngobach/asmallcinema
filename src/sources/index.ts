import { consola } from 'consola';
import { StremioStream } from '../services/streamService';
import { MovieSource } from './types';
import { ceebeeSource } from './ceebee';

// List of all registered movie sources
const sources: MovieSource[] = [
  ceebeeSource
];

/**
 * Queries all registered sources in parallel, catching any errors 
 * gracefully at the source level, and aggregates the returned stream lists.
 */
export async function resolveAllStreams(type: string, id: string): Promise<StremioStream[]> {
  const promises = sources.map(async (source) => {
    try {
      consola.info(`Querying source "${source.name}" for ${type}/${id}`);
      return await source.getStreams(type, id);
    } catch (error) {
      consola.error(`Failed to resolve streams from source "${source.name}":`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
}
