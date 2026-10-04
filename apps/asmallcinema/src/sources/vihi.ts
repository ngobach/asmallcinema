import { StremioStream } from '../services/streamService';
import { getTmdbIdFromImdb } from '../services/wikidataService';
import { MovieSource, StreamRequest } from './types';
import { consola } from 'consola';
import { PUBLIC_URL } from '../config';
import { DEFAULT_USER_AGENT } from '../utils/browser';
import { captureFirstMatchingRequest } from '../utils/cdpBrowser';

const VIDHIVE_REFERER = 'https://vidhive.lol/';
const VIDHIVE_THEME = '16A0B5';
const VIDHIVE_PLAYLIST_TIMEOUT_MS = 45000;

/**
 * Factory function to construct VidHive embed URLs.
 * Accepts the TMDB ID and optional season and episode numbers for series.
 */
function buildVidhiveUrl(tmdbId: string, season?: number, episode?: number): string {
  if (season !== undefined && episode !== undefined) {
    return `https://vidhive.lol/embed/tv/${tmdbId}/${season}/${episode}`;
  }
  return `https://vidhive.lol/embed/movie/${tmdbId}?theme=${VIDHIVE_THEME}`;
}

/**
 * VidHive's player is gated by Cloudflare Turnstile and only starts loading the
 * HLS playlist once the challenge is solved. The playlist requests point at the
 * tokenized CDN path below rather than a ".m3u8" URL.
 */
function isPlaylistRequest(url: string): boolean {
  return url.includes('storage.spidersense.workers.dev/playlist/') || url.includes('.m3u8');
}

export const vihiSource: MovieSource = {
  id: "vihi",
  name: "Vihi",
  async getStreams(req: StreamRequest): Promise<StremioStream[]> {
    consola.debug("[Vihi] Resolving stream via dedicated CDP browser...");

    let tmdbId = req.id.type === 'tmdb' ? req.id.value : null;
    if (!tmdbId) {
      tmdbId = await getTmdbIdFromImdb(req.id.value, req.type);
    }
    const targetUrl = req.type === 'movie'
      ? buildVidhiveUrl(tmdbId)
      : buildVidhiveUrl(tmdbId, req.season, req.episode);

    try {
      consola.debug(`[Vihi] Navigating to: ${targetUrl}`);
      const playlistUrl = await captureFirstMatchingRequest(
        targetUrl,
        isPlaylistRequest,
        VIDHIVE_PLAYLIST_TIMEOUT_MS
      );

      if (!playlistUrl) {
        consola.warn("[Vihi] No playlist request captured before timeout.");
        return [];
      }

      // Construct the proxied stream URL
      const proxiedUrl = `${PUBLIC_URL}/m3u8-proxy?url=${encodeURIComponent(playlistUrl)}&referer=${encodeURIComponent(VIDHIVE_REFERER)}`;

      return [
        {
          title: "[Vihi] Direct",
          url: playlistUrl,
          behaviorHints: {
            notWebReady: true,
            bingeGroup: "vihi-direct",
            proxyHeaders: {
              request: {
                "User-Agent": DEFAULT_USER_AGENT,
                "Referer": VIDHIVE_REFERER
              }
            }
          }
        },
        {
          title: "[Vihi] Proxied",
          url: proxiedUrl,
          behaviorHints: {
            bingeGroup: "vihi-proxied"
          }
        }
      ];
    } catch (error: any) {
      consola.error(`[Vihi] Scraping failed: ${error.message}`);
      return [];
    }
  }
};
