import { consola } from 'consola';

/** How long a browser may sit idle before it is released. */
export const BROWSER_IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export interface IdleReleaserOptions {
  /** How long the resource may sit idle before it is released. 0 disables releasing. */
  timeoutMs: number;
  /** Resource name used in log messages, e.g. "Browser" or "CDP". */
  label: string;
  /** Called when the resource has been idle for timeoutMs. */
  onRelease: () => void | Promise<void>;
}

export interface IdleReleaser {
  /** Marks the start of a request that uses the resource. */
  begin(): void;
  /** Marks the end of a request that uses the resource. */
  end(): void;
  /** Arms the idle countdown when nothing is currently using the resource. */
  markIdle(): void;
}

/**
 * Tracks how many requests are actively using a resource and releases it after
 * a period without activity. Releasing only happens when the active count is
 * zero, so long-running requests are never interrupted.
 */
export function createIdleReleaser(options: IdleReleaserOptions): IdleReleaser {
  const { timeoutMs, label, onRelease } = options;
  const timeoutMinutes = Math.max(1, Math.round(timeoutMs / 60000));

  let active = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let releasing = false;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const arm = () => {
    cancel();
    if (timeoutMs <= 0) {
      return;
    }

    timer = setTimeout(() => {
      timer = null;
      if (active > 0 || releasing) {
        return;
      }

      releasing = true;
      consola.info(`[${label}] Releasing after ${timeoutMinutes} minute${timeoutMinutes === 1 ? '' : 's'} idle.`);
      Promise.resolve(onRelease())
        .catch((error: any) => consola.error(`[${label}] Failed to release idle resource: ${error.message}`))
        .finally(() => {
          releasing = false;
        });
    }, timeoutMs);

    timer.unref?.();
  };

  return {
    begin() {
      active++;
      cancel();
    },
    end() {
      active = Math.max(0, active - 1);
      if (active === 0) {
        arm();
      }
    },
    markIdle() {
      if (active === 0) {
        arm();
      }
    }
  };
}
