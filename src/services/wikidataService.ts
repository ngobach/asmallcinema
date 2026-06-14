import { consola } from 'consola';
import { LRUCache } from 'lru-cache';

interface WikidataResponse {
  results: {
    bindings: Array<{
      tmdbMovieID?: { value: string };
      tmdbTvID?: { value: string };
    }>;
  };
}

// Sentinel value to represent a failed mapping in the cache
const NOT_FOUND = '__NOT_FOUND__';

// Instantiate LRU cache for completed lookups and a map for deduplicating pending requests
const idCache = new LRUCache<string, string>({
  max: 1000
});
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Translates an IMDb ID (e.g., "tt0111161") to a TMDB ID using the Wikidata SPARQL API.
 * Uses an in-memory LRU cache and request deduplication. Throws an error if the ID cannot be resolved.
 */
export async function getTmdbIdFromImdb(imdbId: string): Promise<string> {
  // 1. Check completed lookup cache
  const cachedVal = idCache.get(imdbId);
  if (cachedVal !== undefined) {
    consola.debug(`[Wikidata] Cache hit for "${imdbId}": "${cachedVal}"`);
    if (cachedVal === NOT_FOUND) {
      throw new Error(`Failed to resolve TMDB ID for IMDb ID: ${imdbId}`);
    }
    return cachedVal;
  }

  // 2. Check/deduplicate concurrent pending requests to prevent cache stampede
  let pending = pendingRequests.get(imdbId);
  if (pending) {
    consola.debug(`[Wikidata] Deduplicating active lookup request for "${imdbId}"`);
    return pending;
  }

  // 3. Create, cache, and execute the lookup promise
  pending = (async () => {
    try {
      const result = await fetchTmdbIdFromImdb(imdbId);
      if (!result) {
        idCache.set(imdbId, NOT_FOUND);
        throw new Error(`Failed to resolve TMDB ID for IMDb ID: ${imdbId}`);
      }
      idCache.set(imdbId, result);
      return result;
    } catch (err: any) {
      // Propagate the error so that callers know it failed
      throw err;
    } finally {
      pendingRequests.delete(imdbId);
    }
  })();

  pendingRequests.set(imdbId, pending);
  return pending;
}

/**
 * Performs the actual network lookup against the Wikidata SPARQL endpoint.
 */
async function fetchTmdbIdFromImdb(imdbId: string): Promise<string | null> {
  const query = `
SELECT ?tmdbMovieID ?tmdbTvID WHERE {
  ?item wdt:P345 "${imdbId}".
  OPTIONAL { ?item wdt:P4947 ?tmdbMovieID. }
  OPTIONAL { ?item wdt:P4983 ?tmdbTvID. }
}
LIMIT 1
  `.trim();

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;

  try {
    consola.debug(`[Wikidata] Mapping IMDb ID "${imdbId}" to TMDB ID via Wikidata...`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'asmallcinema/1.0 (https://github.com/ngobach/asmallcinema)',
        'Accept': 'application/sparql-results+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Wikidata SPARQL query failed with status: ${response.status}`);
    }

    const data = (await response.json()) as WikidataResponse;
    const bindings = data.results.bindings;

    if (bindings && bindings.length > 0) {
      const binding = bindings[0];
      const tmdbId = binding.tmdbMovieID?.value || binding.tmdbTvID?.value;
      if (tmdbId) {
        consola.debug(`[Wikidata] Resolved "${imdbId}" -> TMDB ID: "${tmdbId}"`);
        return tmdbId;
      }
    }

    consola.warn(`[Wikidata] No TMDB ID mapping found for IMDb ID: "${imdbId}"`);
    return null;
  } catch (error: any) {
    consola.error(`[Wikidata] Error mapping ID: ${error.message}`);
    return null;
  }
}
