import { StremioStream } from '../services/streamService';

export interface ImdbId {
  type: 'imdb';
  value: string; // e.g. "tt0111161"
}

export interface TmdbId {
  type: 'tmdb';
  value: string; // e.g. "278"
}

export type MediaId = ImdbId | TmdbId;

export interface MovieRequest {
  type: 'movie';
  id: MediaId;
}

export interface SeriesRequest {
  type: 'series';
  id: MediaId;
  season: number;
  episode: number;
}

// Discriminated union of possible stream request types
export type StreamRequest = MovieRequest | SeriesRequest;

export interface MovieSource {
  name: string;
  getStreams(req: StreamRequest): Promise<StremioStream[]>;
}

/**
 * Parses a raw ID string into a discriminated MediaId union.
 */
export function parseMediaId(id: string): MediaId {
  if (id.startsWith('tt')) {
    return { type: 'imdb', value: id };
  }
  if (id.startsWith('tmdb:')) {
    return { type: 'tmdb', value: id.slice(5) };
  }
  // If the ID is purely numeric, it's highly likely to be a TMDB ID
  if (/^\d+$/.test(id)) {
    return { type: 'tmdb', value: id };
  }
  // Default fallback
  return { type: 'imdb', value: id };
}

/**
 * Parses raw Stremio route parameters into a type-safe StreamRequest union.
 * Correctly handles both IMDb and TMDB formats for movies and TV series.
 */
export function parseStreamRequest(type: string, rawId: string): StreamRequest | null {
  if (type === 'movie') {
    const mediaId = parseMediaId(rawId);
    return { type: 'movie', id: mediaId };
  }
  
  if (type === 'series') {
    const parts = rawId.split(':');
    
    // Check for TMDB series format: tmdb:12345:1:2 -> parts[0] === 'tmdb'
    if (parts[0] === 'tmdb' && parts.length >= 4) {
      const [_, tmdbId, seasonStr, episodeStr] = parts;
      const season = parseInt(seasonStr, 10);
      const episode = parseInt(episodeStr, 10);
      
      if (!isNaN(season) && !isNaN(episode)) {
        return {
          type: 'series',
          id: { type: 'tmdb', value: tmdbId },
          season,
          episode
        };
      }
    } else if (parts.length >= 3) {
      // Standard IMDb series format: tt0903747:1:2
      const [seriesId, seasonStr, episodeStr] = parts;
      const season = parseInt(seasonStr, 10);
      const episode = parseInt(episodeStr, 10);
      
      if (!isNaN(season) && !isNaN(episode)) {
        return {
          type: 'series',
          id: parseMediaId(seriesId),
          season,
          episode
        };
      }
    }
  }
  
  return null;
}
