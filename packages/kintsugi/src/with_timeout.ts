import { type AnzenResultFn, Result } from '@daisugi/anzen';
import { Ayamari } from '@daisugi/ayamari';

const { errFn } = new Ayamari();

const defaultMaxTimeMs = 600;
const timeoutErr = Result.failure(
  errFn.Timeout('Operation timed out.'),
);

interface WithTimeoutOpts {
  maxTimeMs?: number;
}

export function withTimeout<
  Fn extends AnzenResultFn<unknown, unknown>,
>(
  fn: Fn,
  opts: WithTimeoutOpts = {},
): (
  ...args: Parameters<Fn>
) => Promise<Awaited<ReturnType<Fn>> | typeof timeoutErr> {
  const maxTimeMs = opts.maxTimeMs ?? defaultMaxTimeMs;
  return function (this: unknown, ...args: any[]) {
    // Normalize to a promise (an AnzenResultFn may return a Result
    // synchronously) and convert a synchronous throw into a rejected promise,
    // so the wrapper always honors its Promise-returning contract.
    const promise = (() => {
      try {
        return Promise.resolve(fn.apply(this, args));
      } catch (reason) {
        return Promise.reject(reason);
      }
    })();
    const timeout = new Promise<typeof timeoutErr>(
      (resolve) => {
        const timeoutId = setTimeout(() => {
          resolve(timeoutErr);
        }, maxTimeMs);
        // Attach a no-op handler so the work settling after a timeout does
        // not raise an unhandled-rejection warning; callers must still handle
        // the returned promise.
        promise
          .catch(() => {})
          .then(() => clearTimeout(timeoutId));
      },
    );
    return Promise.race([timeout, promise]);
  } as (
    ...args: Parameters<Fn>
  ) => Promise<Awaited<ReturnType<Fn>> | typeof timeoutErr>;
}
