import { chromium } from 'playwright';
import { consola } from 'consola';
import { spawn, ChildProcess } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { BROWSER_IDLE_TIMEOUT_MS, createIdleReleaser } from './idleReleaser';

/**
 * Minimal Chrome DevTools Protocol client over a raw WebSocket.
 *
 * VidHive's player is protected by Cloudflare Turnstile, which refuses to issue
 * tokens for browsers launched by Playwright (its launch flags and piped CDP
 * connection are detectable). Launching the browser manually and attaching over
 * a plain WebSocket passes the challenge. Bun's WebSocket works fine, while
 * Playwright's own connectOverCDP hangs under Bun, hence this tiny client.
 */
interface CdpMessage {
  id?: number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
  sessionId?: string;
}

type CdpListener = (msg: CdpMessage) => void;

class CdpConnection {
  private ws: any;
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  private listeners = new Set<CdpListener>();

  private constructor(ws: any) {
    this.ws = ws;

    ws.onmessage = (event: { data: string }) => {
      let msg: CdpMessage;
      try {
        msg = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
      } catch {
        return;
      }

      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const pending = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) {
          pending.reject(new Error(`CDP error: ${JSON.stringify(msg.error)}`));
        } else {
          pending.resolve(msg.result);
        }
        return;
      }

      if (msg.method) {
        for (const listener of [...this.listeners]) {
          listener(msg);
        }
      }
    };

    ws.onclose = () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error('CDP connection closed'));
      }
      this.pending.clear();
    };
  }

  static connect(wsUrl: string): Promise<CdpConnection> {
    return new Promise((resolve, reject) => {
      const WebSocketCtor = (globalThis as any).WebSocket;
      const ws = new WebSocketCtor(wsUrl);
      const connection = new CdpConnection(ws);
      ws.onopen = () => resolve(connection);
      ws.onerror = () => reject(new Error(`Failed to connect to Chrome DevTools at ${wsUrl}`));
    });
  }

  send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  onMessage(listener: CdpListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close(): void {
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }
}

const CHROME_PROFILE_DIR = join(homedir(), '.cache', 'asmallcinema', 'vihi-chrome-profile');
const CHROME_STARTUP_TIMEOUT_MS = 30000;

let chromeProcess: ChildProcess | null = null;
let connection: CdpConnection | null = null;
let initPromise: Promise<CdpConnection> | null = null;
let chromeClosedIntentionally = false;

const idleReleaser = createIdleReleaser({
  timeoutMs: BROWSER_IDLE_TIMEOUT_MS,
  label: 'CDP',
  onRelease: () => closeCdpBrowser()
});

/**
 * Reserves a free localhost port by binding to port 0 and releasing it again.
 * Chrome behaves noticeably better (Turnstile passes) on an explicit fixed
 * port than on --remote-debugging-port=0.
 */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForDevToolsUrl(port: number, proc: ChildProcess): Promise<string> {
  const deadline = Date.now() + CHROME_STARTUP_TIMEOUT_MS;
  let exited = false;
  proc.once('exit', () => {
    exited = true;
  });

  while (Date.now() < deadline) {
    if (exited) {
      throw new Error('Chrome exited during startup');
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) {
        const data = (await response.json()) as { webSocketDebuggerUrl?: string };
        if (data.webSocketDebuggerUrl) {
          return data.webSocketDebuggerUrl;
        }
      }
    } catch {
      // DevTools endpoint not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Timed out waiting for the Chrome DevTools endpoint');
}

async function launchChrome(): Promise<CdpConnection> {
  const executablePath = chromium.executablePath();
  const port = await findFreePort();
  mkdirSync(dirname(CHROME_PROFILE_DIR), { recursive: true });
  chromeClosedIntentionally = false;

  consola.info('[CDP] Launching dedicated Chromium for VidHive...');
  const proc = spawn(executablePath, [
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${CHROME_PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    // Required inside containers: Chrome runs as root and /dev/shm is small
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1280,720',
    'about:blank'
  ], { stdio: 'ignore' });

  chromeProcess = proc;

  const wsUrl = await waitForDevToolsUrl(port, proc);

  proc.on('exit', () => {
    chromeProcess = null;
    connection = null;
    if (!chromeClosedIntentionally) {
      consola.warn('[CDP] Dedicated Chromium exited. It will be relaunched on demand.');
    }
  });

  const cdp = await CdpConnection.connect(wsUrl);
  consola.success('[CDP] Dedicated Chromium ready.');
  idleReleaser.markIdle();
  return cdp;
}

/**
 * Returns the dedicated CDP browser connection, launching Chrome on first use.
 * Concurrent callers during initialization share the same launch promise.
 */
export async function getCdpConnection(): Promise<CdpConnection> {
  if (connection) {
    return connection;
  }

  if (!initPromise) {
    initPromise = launchChrome()
      .then((cdp) => {
        connection = cdp;
        return cdp;
      })
      .finally(() => {
        initPromise = null;
      });
  }

  return initPromise;
}

/**
 * Opens a new tab, navigates to the target URL and resolves with the first
 * network request URL matching the predicate, or null on timeout.
 */
export async function captureFirstMatchingRequest(
  targetUrl: string,
  matches: (url: string) => boolean,
  timeoutMs: number
): Promise<string | null> {
  idleReleaser.begin();
  try {
    const cdp = await getCdpConnection();
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    let timer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;

    try {
      await cdp.send('Network.enable', {}, sessionId);
      await cdp.send('Page.enable', {}, sessionId);

      const found = new Promise<string | null>((resolve) => {
        unsubscribe = cdp.onMessage((msg) => {
          if (msg.sessionId !== sessionId || msg.method !== 'Network.requestWillBeSent') {
            return;
          }
          const url = msg.params?.request?.url;
          if (typeof url === 'string' && matches(url)) {
            resolve(url);
          }
        });

        timer = setTimeout(() => resolve(null), timeoutMs);
      });

      await cdp.send('Page.navigate', { url: targetUrl }, sessionId);
      return await found;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
      (unsubscribe as (() => void) | null)?.();
      await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
    }
  } finally {
    idleReleaser.end();
  }
}

/**
 * Kills the dedicated Chrome process and clears the singleton references.
 */
export async function closeCdpBrowser(): Promise<void> {
  const proc = chromeProcess;
  if (!proc) {
    return;
  }

  chromeClosedIntentionally = true;
  connection?.close();
  connection = null;
  chromeProcess = null;
  proc.kill();
}
