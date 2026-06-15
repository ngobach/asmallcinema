import { Browser, BrowserContext } from 'playwright';

export const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Creates a Playwright browser context using default browser configurations and user agent.
 */
export async function createDefaultContext(browser: Browser): Promise<BrowserContext> {
  return await browser.newContext({
    userAgent: DEFAULT_USER_AGENT,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
}
