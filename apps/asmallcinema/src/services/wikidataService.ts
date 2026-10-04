import { consola } from 'consola';
import { LRUCache } from 'lru-cache';
import { TMDB_API_KEY } from '../config';

export type MediaType = 'movie' | 'series';

interface WikidataResponse {
  results: {
    bindings: Array<{
      tmdbMovieID?: { value: string };
      tmdbTvID?: { value: string };
    }>;
  };
}

interface TmdbFindResponse {
  movie_results?: Array<{ id: number }>;
  tv_results?: Array<{ id: number }>;
}

// Sentinel value to represent a failed mapping in the cache
const NOT_FOUND = '__NOT_FOUND__';

// Positive mappings are stable; negative results expire sooner so that newly
// added Wikidata entries are picked up without a process restart.
const POSITIVE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 30 * 60 * 1000;

// Instantiate LRU cache for completed lookups and a map for deduplicating pending requests
const idCache = new LRUCache<string, string>({
  max: 1000,
  ttlAutopurge: true
});
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Translates an IMDb ID (e.g., "tt0111161") to a TMDB ID.
 *
 * Wikidata is queried first; when it has no TMDB mapping (common for new
 * releases), the TMDB API is used as a fallback when TMDB_API_KEY is set.
 * Uses an in-memory LRU cache and request deduplication. Throws an error if
 * the ID cannot be resolved.
 */
export async function getTmdbIdFromImdb(imdbId: string, type?: MediaType): Promise<string> {
  // 1. Check completed lookup cache
  const cachedVal = idCache.get(imdbId);
  if (cachedVal !== undefined) {
    consola.debug(`[TMDB] Cache hit for "${imdbId}": "${cachedVal}"`);
    if (cachedVal === NOT_FOUND) {
      throw new Error(`Failed to resolve TMDB ID for IMDb ID: ${imdbId}`);
    }
    return cachedVal;
  }

  // 2. Check/deduplicate concurrent pending requests to prevent cache stampede
  let pending = pendingRequests.get(imdbId);
  if (pending) {
    consola.debug(`[TMDB] Deduplicating active lookup request for "${imdbId}"`);
    return pending;
  }

  // 3. Create, cache, and execute the lookup promise
  pending = (async () => {
    try {
      const result = await resolveTmdbId(imdbId, type);
      if (!result) {
        idCache.set(imdbId, NOT_FOUND, { ttl: NEGATIVE_TTL_MS });
        throw new Error(`Failed to resolve TMDB ID for IMDb ID: ${imdbId}`);
      }
      idCache.set(imdbId, result, { ttl: POSITIVE_TTL_MS });
      return result;
    } finally {
      pendingRequests.delete(imdbId);
    }
  })();

  pendingRequests.set(imdbId, pending);
  return pending;
}

/**
 * Resolves an IMDb ID to a TMDB ID, preferring Wikidata and falling back to
 * the TMDB API when configured.
 */
async function resolveTmdbId(imdbId: string, type?: MediaType): Promise<string | null> {
  try {
    const wikidataId = await fetchTmdbIdFromWikidata(imdbId);
    if (wikidataId) {
      return wikidataId;
    }
  } catch (error: any) {
    consola.error(`[Wikidata] Error mapping ID: ${error.message}`);
  }

  if (!TMDB_API_KEY) {
    consola.warn(
      `[Wikidata] No TMDB ID mapping found for IMDb ID: "${imdbId}" (set TMDB_API_KEY to enable the TMDB fallback)`
    );
    return null;
  }

  try {
    return await fetchTmdbIdFromTmdbApi(imdbId, type);
  } catch (error: any) {
    consola.error(`[TMDB] Error mapping ID: ${error.message}`);
    return null;
  }
}

/**
 * Performs the actual network lookup against the Wikidata SPARQL endpoint.
 * Returns null when the item has no TMDB mapping; throws on network errors.
 */
async function fetchTmdbIdFromWikidata(imdbId: string): Promise<string | null> {
  const query = `
SELECT ?tmdbMovieID ?tmdbTvID WHERE {
  ?item wdt:P345 "${imdbId}".
  OPTIONAL { ?item wdt:P4947 ?tmdbMovieID. }
  OPTIONAL { ?item wdt:P4983 ?tmdbTvID. }
}
LIMIT 1
  `.trim();

  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;

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

  consola.debug(`[Wikidata] No TMDB ID mapping found for IMDb ID: "${imdbId}"`);
  return null;
}

/**
 * Fallback lookup against the TMDB "find by external ID" endpoint.
 */
async function fetchTmdbIdFromTmdbApi(imdbId: string, type?: MediaType): Promise<string | null> {
  const url = `https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}?external_source=imdb_id&api_key=${encodeURIComponent(TMDB_API_KEY)}`;

  consola.debug(`[TMDB] Mapping IMDb ID "${imdbId}" to TMDB ID via TMDB API...`);
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`TMDB find query failed with status: ${response.status}`);
  }

  const data = (await response.json()) as TmdbFindResponse;
  const movieResults = data.movie_results ?? [];
  const tvResults = data.tv_results ?? [];

  // Prefer the expected media type, but fall back to the other list when the
  // type-specific lookup is empty (Stremio occasionally categorizes differently).
  const candidates = type === 'series'
    ? [...tvResults, ...movieResults]
    : [...movieResults, ...tvResults];

  const tmdbId = candidates[0]?.id;
  if (tmdbId) {
    consola.debug(`[TMDB] Resolved "${imdbId}" -> TMDB ID: "${tmdbId}"`);
    return String(tmdbId);
  }

  consola.warn(`[TMDB] No TMDB match found for IMDb ID: "${imdbId}"`);
  return null;
}
