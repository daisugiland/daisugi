import { withPool, createWithPool } from '../withPool';
import { deferredPromise } from '../deferredPromise';

async function fn1(arg) {
  return arg;
}

async function fn2(arg) {
  arg.isStarted = true;

  const response = await arg.when.promise;

  arg.isDone = true;

  return response;
}

function createParams() {
  return {
    isStarted: false,
    isDone: false,
    when: deferredPromise(),
  };
}

describe('createWithPool', () => {
  it('should provide expected function', () => {
    expect(typeof createWithPool).toBe('function');
  });

  describe('when we customize concurrency', () => {
    it('should be started and be done with expected responses', async () => {
      const { withPool } = createWithPool({
        concurrencyCount: 1,
      });

      const fnWithPool1 = withPool(fn2);
      const fnWithPool2 = withPool(fn2);

      const params1 = createParams();
      const when1 = fnWithPool1(params1);

      const params2 = createParams();
      const when2 = fnWithPool2(params2);

      expect(params1.isStarted).toBe(true);
      expect(params1.isDone).toBe(false);

      expect(params2.isStarted).toBe(false);
      expect(params2.isDone).toBe(false);

      params1.when.resolve('OK1');
      const response1 = await when1;

      expect(params1.isDone).toBe(true);
      expect(response1).toBe('OK1');

      expect(params2.isStarted).toBe(true);
      expect(params2.isDone).toBe(false);

      params2.when.resolve('OK2');
      const response2 = await when2;

      expect(params2.isDone).toBe(true);
      expect(response2).toBe('OK2');
    });
  });
});

describe('withPool', () => {
  it('should provide expected function', () => {
    expect(typeof withPool).toBe('function');
  });

  it('should return expected response based on arguments', async () => {
    const fnWithPool = withPool(fn1);

    const [response1, response2, response3] =
      await Promise.all([
        fnWithPool('OK1'),
        fnWithPool('OK2'),
        fnWithPool('OK3'),
      ]);

    expect(response1).toBe('OK1');
    expect(response2).toBe('OK2');
    expect(response3).toBe('OK3');
  });

  describe('when we sequentially call with concurrency of 2', () => {
    it('should be started and be done with expected responses', async () => {
      const fnWithPool = withPool(fn2);

      // Call first, second, third and fourth functions.
      const params1 = createParams();
      const when1 = fnWithPool(params1);

      const params2 = createParams();
      fnWithPool(params2);

      const params3 = createParams();
      const when3 = fnWithPool(params3);

      const params4 = createParams();
      fnWithPool(params4);

      // First and second function should be started and should NOT be done.
      expect(params1.isStarted).toBe(true);
      expect(params2.isStarted).toBe(true);

      expect(params1.isDone).toBe(false);
      expect(params2.isDone).toBe(false);

      // Third and fourth function should NOT be started.
      expect(params3.isStarted).toBe(false);
      expect(params4.isStarted).toBe(false);

      // We resolve the promise of the first function.
      params1.when.resolve('OK1');

      // We wait for the first function to be done.
      const response1 = await when1;

      // First function should be done.
      expect(params1.isDone).toBe(true);
      expect(response1).toBe('OK1');

      // Second function should NOT be done.
      expect(params2.isDone).toBe(false);

      // Third function should be started.
      expect(params3.isStarted).toBe(true);

      // Fourth function should NOT be started.
      expect(params4.isStarted).toBe(false);

      // We resolve the promise of the third function.
      params3.when.resolve('OK3');

      // We wait for the third function to be done.
      const response3 = await when3;

      // Second function should NOT be done.
      expect(params2.isDone).toBe(false);

      // Third function should be done.
      expect(params3.isDone).toBe(true);
      expect(response3).toBe('OK3');

      // Fourth function should be started.
      expect(params4.isStarted).toBe(true);
    });

    describe('when we customize concurrency', () => {
      it('should be started and be done with expected responses', async () => {
        const fnWithPool = withPool(fn2, {
          concurrencyCount: 1,
        });

        const params1 = createParams();
        const when1 = fnWithPool(params1);

        const params2 = createParams();
        const when2 = fnWithPool(params2);

        expect(params1.isStarted).toBe(true);
        expect(params1.isDone).toBe(false);

        expect(params2.isStarted).toBe(false);
        expect(params2.isDone).toBe(false);

        params1.when.resolve('OK1');
        const response1 = await when1;

        expect(params1.isDone).toBe(true);
        expect(response1).toBe('OK1');

        expect(params2.isStarted).toBe(true);
        expect(params2.isDone).toBe(false);

        params2.when.resolve('OK2');
        const response2 = await when2;

        expect(params2.isDone).toBe(true);
        expect(response2).toBe('OK2');
      });
    });

    describe('when one function is rejected', () => {
      it('should be started and be done with expected responses', async () => {
        const fnWithPool = withPool(fn2, {
          concurrencyCount: 1,
        });

        const params1 = createParams();
        const when1 = fnWithPool(params1);

        const params2 = createParams();
        const when2 = fnWithPool(params2);

        expect(params1.isStarted).toBe(true);
        expect(params1.isDone).toBe(false);

        expect(params2.isStarted).toBe(false);
        expect(params2.isDone).toBe(false);

        params1.when.reject('KO1');
        await expect(when1).rejects.toBe('KO1');

        expect(params1.isDone).toBe(false);

        expect(params2.isStarted).toBe(true);
        expect(params2.isDone).toBe(false);

        params2.when.resolve('OK2');
        const response2 = await when2;

        expect(params2.isDone).toBe(true);
        expect(response2).toBe('OK2');
      });
    });
  });
});
