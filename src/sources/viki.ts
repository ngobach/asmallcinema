import { StremioStream } from '../services/streamService';
import { MovieSource, StreamRequest } from './types';
import { chromium } from 'playwright';
import { consola } from 'consola';
import { PUBLIC_URL } from '../config';
import { createDefaultContext, DEFAULT_USER_AGENT } from '../utils/browser';

/**
 * Factory function to construct VidKing embed URLs.
 * Accepts the TMDB ID and optional season and episode numbers for series.
 */
function buildVidkingUrl(tmdbId: string, season?: number, episode?: number): string {
  if (season !== undefined && episode !== undefined) {
    return `https://www.vidking.net/embed/series/${tmdbId}/${season}/${episode}`;
  }
  return `https://www.vidking.net/embed/movie/${tmdbId}`;
}

export const vikiSource: MovieSource = {
  name: "Viki",
  async getStreams(req: StreamRequest): Promise<StremioStream[]> {
    consola.debug("[Viki] Launching headless browser to resolve stream...");
    
    const tmdbId = req.id.type === 'tmdb' ? req.id.value : '278';
    const targetUrl = req.type === 'movie'
      ? buildVidkingUrl(tmdbId)
      : buildVidkingUrl(tmdbId, req.season, req.episode);
      
    const browser = await chromium.launch({ headless: true });
    
    try {
      // Create context using the reusable app-level browser configuration
      const context = await createDefaultContext(browser);
      const page = await context.newPage();
      
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
            title: "[Viki] Direct HLS Stream",
            url: m3u8Url,
            behaviorHints: {
              proxyHeaders: {
                request: {
                  "User-Agent": DEFAULT_USER_AGENT,
                  "Referer": "https://www.vidking.net/"
                }
              }
            }
          },
          {
            title: "[Viki] Proxied HLS Stream",
            url: proxiedUrl
          }
        ];
      }
    } catch (error: any) {
      consola.error(`[Viki] Scraping failed: ${error.message}`);
    } finally {
      // Guarantee browser is closed to avoid memory/process leaks
      await browser.close();
      consola.debug("[Viki] Headless browser closed.");
    }
    
    return [];
  }
};
