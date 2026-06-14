import { StremioStream } from '../services/streamService';
import { MovieSource, StreamRequest } from './types';
import { chromium } from 'playwright';
import { consola } from 'consola';

export const ceebeeSource: MovieSource = {
  name: "CeeBee",
  async getStreams(req: StreamRequest): Promise<StremioStream[]> {
    consola.info("[CeeBee] Launching headless browser to resolve stream...");
    
    // For now, hardcode target URL as requested
    const targetUrl = "https://www.vidking.net/embed/movie/278";
    
    const browser = await chromium.launch({ headless: true });
    
    try {
      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      });
      const page = await context.newPage();
      
      // Promise that resolves when a .m3u8 request is captured
      const m3u8Promise = new Promise<string>((resolve) => {
        page.on('request', (request) => {
          const url = request.url();
          if (url.includes('.m3u8')) {
            consola.success(`[CeeBee] Intercepted m3u8 URL: ${url}`);
            resolve(url);
          }
        });
      });
      
      // Timeout promise to prevent hanging
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout waiting for m3u8 stream")), 30000)
      );
      
      // Trigger navigation
      consola.info(`[CeeBee] Navigating to: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      
      // Wait for the network interceptor to capture the stream or hit timeout
      const m3u8Url = await Promise.race([m3u8Promise, timeoutPromise]);
      
      if (m3u8Url) {
        return [
          {
            title: "[CeeBee] Scraped HLS Stream",
            url: m3u8Url
          }
        ];
      }
    } catch (error: any) {
      consola.error(`[CeeBee] Scraping failed: ${error.message}`);
    } finally {
      // Guarantee browser is closed to avoid memory/process leaks
      await browser.close();
      consola.info("[CeeBee] Headless browser closed.");
    }
    
    return [];
  }
};
