import {
  type AnzenResultFailure,
  type AnzenResultFn,
  failure,
} from '@daisugi/anzen';
import { type AyamariErr, Ayamari } from '@daisugi/ayamari';

const defaultMaxTimeMs = 600;

type TimeoutErr = AnzenResultFailure<AyamariErr>;

// Built lazily on the first timeout so importing this module does no
// top-level work (no eager `new Ayamari()` or Result allocation), honoring
// the package's `sideEffects: false`. The failure is shared across all calls.
let timeoutErr: TimeoutErr | undefined;
function getTimeoutErr(): TimeoutErr {
  return (timeoutErr ??= failure(
    new Ayamari().errFn.Timeout('Operation timed out.'),
  ));
}

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
) => Promise<Awaited<ReturnType<Fn>> | TimeoutErr> {
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
    const timeout = new Promise<TimeoutErr>((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(getTimeoutErr());
      }, maxTimeMs);
      // Attach a no-op handler so the work settling after a timeout does
      // not raise an unhandled-rejection warning; callers must still handle
      // the returned promise.
      promise
        .catch(() => {})
        .then(() => clearTimeout(timeoutId));
    });
    return Promise.race([timeout, promise]);
  } as (
    ...args: Parameters<Fn>
  ) => Promise<Awaited<ReturnType<Fn>> | TimeoutErr>;
}
