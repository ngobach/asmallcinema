import { StremioStream } from '../services/streamService';
import { getTmdbIdFromImdb } from '../services/wikidataService';
import { MovieSource, StreamRequest } from './types';
import { consola } from 'consola';
import { PUBLIC_URL } from '../config';
import { DEFAULT_USER_AGENT, getBrowserContext } from '../utils/browser';

/**
 * Factory function to construct VidKing embed URLs.
 * Accepts the TMDB ID and optional season and episode numbers for series.
 */
function buildVidkingUrl(tmdbId: string, season?: number, episode?: number): string {
  if (season !== undefined && episode !== undefined) {
    return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}`;
  }
  return `https://www.vidking.net/embed/movie/${tmdbId}`;
}

export const vikiSource: MovieSource = {
  id: "viki",
  name: "Viki",
  async getStreams(req: StreamRequest): Promise<StremioStream[]> {
    consola.debug("[Viki] Resolving stream with shared browser...");
    
    let tmdbId = req.id.type === 'tmdb' ? req.id.value : null;
    if (!tmdbId) {
      tmdbId = await getTmdbIdFromImdb(req.id.value, req.type);
    }
    const targetUrl = req.type === 'movie'
      ? buildVidkingUrl(tmdbId)
      : buildVidkingUrl(tmdbId, req.season, req.episode);
      
    // Reuse the app-wide shared browser context; each request gets its own page.
    const context = await getBrowserContext();
    const page = await context.newPage();
    
    try {
      // Promise that resolves when a .m3u8 request is captured
      const m3u8Promise = new Promise<string>((resolve) => {
        page.on('request', (request) => {
          const url = request.url();
          if (url.includes('.m3u8')) {
            consola.debug(`[Viki] Intercepted m3u8 URL: ${url}`);
            resolve(url);
          }
        });
      });
      
      // Timeout promise to prevent hanging
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout waiting for m3u8 stream")), 30000)
      );
      
      // Trigger navigation
      consola.debug(`[Viki] Navigating to: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      
      // Wait for the network interceptor to capture the stream or hit timeout
      const m3u8Url = await Promise.race([m3u8Promise, timeoutPromise]);
      
      if (m3u8Url) {
        // Construct the proxied stream URL
        const proxiedUrl = `${PUBLIC_URL}/m3u8-proxy?url=${encodeURIComponent(m3u8Url)}&referer=${encodeURIComponent('https://www.vidking.net/')}`;

        return [
          {
            title: "[Viki] Direct",
            url: m3u8Url,
            behaviorHints: {
              notWebReady: true,
              bingeGroup: "viki-direct",
              proxyHeaders: {
                request: {
                  "User-Agent": DEFAULT_USER_AGENT,
                  "Referer": "https://www.vidking.net/"
                }
              }
            }
          },
          {
            title: "[Viki] Proxied",
            url: proxiedUrl,
            behaviorHints: {
              bingeGroup: "viki-proxied"
            }
          }
        ];
      }
    } catch (error: any) {
      consola.error(`[Viki] Scraping failed: ${error.message}`);
    } finally {
      // Close the page, not the browser: the shared context stays alive for other requests
      await page.close().catch(() => {});
      consola.debug("[Viki] Page closed.");
    }
    
    return [];
  }
};
