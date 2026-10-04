import { Browser, BrowserContext, chromium } from 'playwright';
import { consola } from 'consola';

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

// Module-level singleton shared across all requests
let browser: Browser | null = null;
let context: BrowserContext | null = null;
let initPromise: Promise<BrowserContext> | null = null;
let shuttingDown = false;

async function launchBrowserContext(): Promise<BrowserContext> {
  consola.info('[Browser] Launching shared Chromium browser...');
  const launched = await chromium.launch({ headless: true });
  browser = launched;
  context = await createDefaultContext(launched);

  // If the browser crashes, clear the singleton so the next request relaunches it
  launched.on('disconnected', () => {
    browser = null;
    context = null;
    if (!shuttingDown) {
      consola.warn('[Browser] Shared Chromium browser disconnected. It will be relaunched on demand.');
    }
  });

  consola.success('[Browser] Shared Chromium context ready.');
  return context;
}

/**
 * Returns the app-wide shared browser context, launching it on first use.
 * Concurrent callers during initialization share the same launch promise.
 */
export async function getBrowserContext(): Promise<BrowserContext> {
  if (context) {
    return context;
  }

  if (!initPromise) {
    initPromise = launchBrowserContext().finally(() => {
      initPromise = null;
    });
  }

  return initPromise;
}

/**
 * Closes the shared browser and clears the singleton references.
 */
export async function closeBrowser(): Promise<void> {
  const current = browser;
  if (!current) {
    return;
  }

  browser = null;
  context = null;
  shuttingDown = true;
  try {
    await current.close();
  } finally {
    shuttingDown = false;
  }
}
