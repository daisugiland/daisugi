import { Result } from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

import type { AsyncFn } from './types.js';

const { errFn } = new Ayamari();

const defaultMaxTimeMs = 600;
const timeoutErr = Result.failure(
  errFn.Timeout('Operation timed out.'),
);

interface WithTimeoutOpts {
  maxTimeMs?: number;
}

export function withTimeout<Fn extends AsyncFn>(
  fn: Fn,
  opts: WithTimeoutOpts = {},
): (
  ...args: Parameters<Fn>
) => Promise<Awaited<ReturnType<Fn>> | typeof timeoutErr> {
  const maxTimeMs = opts.maxTimeMs ?? defaultMaxTimeMs;
  return function (this: unknown, ...args: Parameters<Fn>) {
    const promise = fn.apply(this, args);
    const timeout = new Promise<typeof timeoutErr>(
      (resolve) => {
        const timeoutId = setTimeout(() => {
          resolve(timeoutErr);
        }, maxTimeMs);
        //This will handle the promise (and makes possible unhandled-rejection warnings away) to avoid breaking on errors, but you should still handle this promise!
        promise
          .catch(() => {})
          .then(() => clearTimeout(timeoutId));
      },
    );
    return Promise.race([timeout, promise]);
  };
}
