import { consola } from 'consola';
import { StremioStream } from '../services/streamService';
import { MovieSource, StreamRequest } from './types';
import { vikiSource } from './viki';
import { vihiSource } from './vihi';
import { ENABLED_SOURCES } from '../config';

// List of all registered movie sources
const allSources: MovieSource[] = [
  vikiSource,
  vihiSource
];

/**
 * Filters the source registry based on the ENABLED_SOURCES configuration.
 * An unset/empty list enables every source; unknown ids are ignored with a warning.
 */
function filterEnabledSources(registry: MovieSource[]): MovieSource[] {
  const validIds = registry.map((source) => source.id);

  if (ENABLED_SOURCES.length === 0) {
    consola.info(`Enabled sources: ${validIds.join(', ')}`);
    return registry;
  }

  const unknownIds = ENABLED_SOURCES.filter((id) => !validIds.includes(id));
  if (unknownIds.length > 0) {
    consola.warn(`Unknown source id(s) ignored: ${unknownIds.join(', ')}. Valid ids: ${validIds.join(', ')}`);
  }

  const enabled = registry.filter((source) => ENABLED_SOURCES.includes(source.id));
  if (enabled.length === 0) {
    consola.warn('No valid sources enabled. Stream requests will return empty results.');
  } else {
    consola.info(`Enabled sources: ${enabled.map((source) => source.id).join(', ')}`);
  }

  return enabled;
}

const sources = filterEnabledSources(allSources);

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
