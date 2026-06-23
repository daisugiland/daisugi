import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Kado, scope } from '../kado.js';

// Kado throws native `Error`s; an injected factory may enrich them with
// a `code` (e.g. `@daisugi/ayamari`), so it is optional here.
type ThrownErr = Error & { code?: string };

describe('child container', () => {
  it('falls through to the parent for unregistered tokens', async () => {
    const { container: root } = new Kado();
    root.register([{ token: 'DbPool', useValue: 'pool' }]);

    const child = root.createChildContainer();

    assert.strictEqual(
      await child.resolve('DbPool'),
      'pool',
    );
  });

  it('walks the full ancestor chain', async () => {
    const { container: root } = new Kado();
    root.register([{ token: 'Config', useValue: 'cfg' }]);

    const middle = root.createChildContainer();
    const leaf = middle.createChildContainer();

    assert.strictEqual(await leaf.resolve('Config'), 'cfg');
  });

  it('throws NotFound when no ancestor has the token', async () => {
    const { container: root } = new Kado();
    const child = root.createChildContainer();

    await assert.rejects(
      child.resolve('Missing'),
      (err) => {
        assert.strictEqual(
          (err as ThrownErr).code,
          'NotFound',
        );
        return true;
      },
    );
  });

  it('child overrides shadow the parent registration', async () => {
    const { container: root } = new Kado();
    root.register([{ token: 'Env', useValue: 'prod' }]);

    const child = root.createChildContainer();
    child.register([{ token: 'Env', useValue: 'test' }]);

    assert.strictEqual(await root.resolve('Env'), 'prod');
    assert.strictEqual(await child.resolve('Env'), 'test');
  });

  it('resolves a child class with a param inherited from the parent', async () => {
    const { container: root } = new Kado();
    root.register([{ token: 'DbPool', useValue: 'pool' }]);

    class UserRepo {
      constructor(public dbPool: string) {}
    }

    const child = root.createChildContainer();
    child.register([
      {
        token: 'UserRepo',
        useClass: UserRepo,
        params: ['DbPool'],
        scope: scope.ContainerScoped,
      },
    ]);

    const repo = await child.resolve<UserRepo>('UserRepo');
    assert.strictEqual(repo.dbPool, 'pool');
  });
});

describe('ContainerScoped scope', () => {
  it('caches one instance per container', async () => {
    const { container: root } = new Kado();
    class Svc {}
    root.register([
      {
        token: 'Svc',
        useClass: Svc,
        scope: scope.ContainerScoped,
      },
    ]);

    const child = root.createChildContainer();

    const a = await child.resolve<Svc>('Svc');
    const b = await child.resolve<Svc>('Svc');

    assert.strictEqual(a, b);
  });

  it('is isolated across sibling containers', async () => {
    const { container: root } = new Kado();
    class Svc {}
    root.register([
      {
        token: 'Svc',
        useClass: Svc,
        scope: scope.ContainerScoped,
      },
    ]);

    const childA = root.createChildContainer();
    const childB = root.createChildContainer();

    const a = await childA.resolve<Svc>('Svc');
    const b = await childB.resolve<Svc>('Svc');

    assert.notStrictEqual(a, b);
  });

  it('differs from the parent instance (inherited registration)', async () => {
    const { container: root } = new Kado();
    class Svc {}
    root.register([
      {
        token: 'Svc',
        useClass: Svc,
        scope: scope.ContainerScoped,
      },
    ]);

    const child = root.createChildContainer();

    const rootInstance = await root.resolve<Svc>('Svc');
    const childInstance = await child.resolve<Svc>('Svc');

    assert.notStrictEqual(rootInstance, childInstance);
  });

  it('contrasts with Singleton, which is shared across the chain', async () => {
    const { container: root } = new Kado();
    class Logger {}
    root.register([
      {
        token: 'Logger',
        useClass: Logger,
        scope: scope.Singleton,
      },
    ]);

    const child = root.createChildContainer();

    const rootLogger = await root.resolve<Logger>('Logger');
    const childLogger =
      await child.resolve<Logger>('Logger');

    assert.strictEqual(rootLogger, childLogger);
  });
});

describe('nested scopes (app → request → transaction)', () => {
  it('each level resolves its own concerns and shares ancestors', async () => {
    const { container: root } = new Kado();

    class DbPool {}
    class UserRepo {
      constructor(
        public dbPool: DbPool,
        public ctx: { userId: number },
      ) {}
    }
    class OrderRepo {
      constructor(
        public tx: { id: number },
        public dbPool: DbPool,
      ) {}
    }
    class OrderService {
      constructor(
        public orderRepo: OrderRepo,
        public userRepo: UserRepo,
      ) {}
    }

    // Level 0: app
    const app = root.createChildContainer();
    app.register([{ token: 'DbPool', useClass: DbPool }]);

    // Level 1: per-request
    const request = app.createChildContainer();
    request.register([
      {
        token: 'RequestContext',
        useValue: { userId: 7 },
      },
      {
        token: 'UserRepo',
        useClass: UserRepo,
        params: ['DbPool', 'RequestContext'],
        scope: scope.ContainerScoped,
      },
    ]);

    // Level 2: per-transaction
    const tx = request.createChildContainer();
    tx.register([
      { token: 'Transaction', useValue: { id: 1 } },
      {
        token: 'OrderRepo',
        useClass: OrderRepo,
        params: ['Transaction', 'DbPool'],
        scope: scope.ContainerScoped,
      },
      {
        token: 'OrderService',
        useClass: OrderService,
        params: ['OrderRepo', 'UserRepo'],
        scope: scope.ContainerScoped,
      },
    ]);

    const service =
      await tx.resolve<OrderService>('OrderService');

    // DbPool (app) is the same shared singleton everywhere.
    assert.strictEqual(
      service.orderRepo.dbPool,
      service.userRepo.dbPool,
    );
    // Transaction (tx) and RequestContext (request) reached via
    // the chain.
    assert.strictEqual(service.orderRepo.tx.id, 1);
    assert.strictEqual(service.userRepo.ctx.userId, 7);
  });

  it('sibling requests get isolated ContainerScoped instances', async () => {
    const { container: root } = new Kado();
    class DbPool {}
    class UserRepo {
      constructor(public dbPool: DbPool) {}
    }
    const app = root.createChildContainer();
    app.register([{ token: 'DbPool', useClass: DbPool }]);

    function makeRequest() {
      const request = app.createChildContainer();
      request.register([
        {
          token: 'UserRepo',
          useClass: UserRepo,
          params: ['DbPool'],
          scope: scope.ContainerScoped,
        },
      ]);
      return request;
    }

    const r1 = makeRequest();
    const r2 = makeRequest();

    const repo1 = await r1.resolve<UserRepo>('UserRepo');
    const repo2 = await r2.resolve<UserRepo>('UserRepo');

    // Different UserRepo per request...
    assert.notStrictEqual(repo1, repo2);
    // ...but the shared DbPool singleton is identical.
    assert.strictEqual(repo1.dbPool, repo2.dbPool);
  });
});

describe('circular dependency across containers', () => {
  it('detects a parent-side cycle reached through child fallthrough', async () => {
    const { container: root } = new Kado();

    class P {
      constructor(public q: unknown) {}
    }
    class Q {
      constructor(public p: unknown) {}
    }
    class Controller {
      constructor(public p: unknown) {}
    }

    // The cycle p ➡️ q 🔄 p lives entirely in the parent (a
    // parent token cannot reference a child token - that would be
    // a NotFound, never a cycle).
    root.register([
      { token: 'p', useClass: P, params: ['q'] },
      { token: 'q', useClass: Q, params: ['p'] },
    ]);

    // Resolution starts from the child and walks up the chain to
    // the cyclic parent tokens; the check must still catch it.
    const child = root.createChildContainer();
    child.register([
      {
        token: 'Controller',
        useClass: Controller,
        params: ['p'],
        scope: scope.ContainerScoped,
      },
    ]);

    await assert.rejects(
      child.resolve('Controller'),
      (err) => {
        assert.strictEqual(
          (err as ThrownErr).code,
          'CircularDependencyDetected',
        );
        return true;
      },
    );
  });

  it('does not flag a valid cross-container graph', async () => {
    const { container: root } = new Kado();
    class Repo {
      constructor(public pool: string) {}
    }
    class Service {
      constructor(public repo: Repo) {}
    }
    root.register([{ token: 'Pool', useValue: 'pool' }]);

    const child = root.createChildContainer();
    child.register([
      {
        token: 'Repo',
        useClass: Repo,
        params: ['Pool'],
        scope: scope.ContainerScoped,
      },
      {
        token: 'Service',
        useClass: Service,
        params: ['Repo'],
        scope: scope.ContainerScoped,
      },
    ]);

    const service = await child.resolve<Service>('Service');
    assert.ok(service instanceof Service);
    assert.strictEqual(service.repo.pool, 'pool');
  });
});

describe('get() across the chain', () => {
  it('returns an inherited manifest item', () => {
    const { container: root } = new Kado();
    root.register([{ token: 'DbPool', useValue: 'pool' }]);

    const child = root.createChildContainer();

    assert.deepStrictEqual(child.get('DbPool'), {
      token: 'DbPool',
      useValue: 'pool',
    });
  });

  it('prefers the child registration when shadowed', () => {
    const { container: root } = new Kado();
    root.register([{ token: 'Env', useValue: 'prod' }]);

    const child = root.createChildContainer();
    child.register([{ token: 'Env', useValue: 'test' }]);

    assert.strictEqual(root.get('Env').useValue, 'prod');
    assert.strictEqual(child.get('Env').useValue, 'test');
  });

  it('throws NotFound when no ancestor has the token', () => {
    const { container: root } = new Kado();
    const child = root.createChildContainer();

    assert.throws(
      () => child.get('Missing'),
      (err) => {
        assert.strictEqual(
          (err as ThrownErr).code,
          'NotFound',
        );
        return true;
      },
    );
  });
});

describe('list() across the chain', () => {
  it('includes inherited registrations', () => {
    const { container: root } = new Kado();
    root.register([{ token: 'DbPool', useValue: 'pool' }]);

    const child = root.createChildContainer();
    child.register([
      { token: 'RequestContext', useValue: { userId: 1 } },
    ]);

    const tokens = child
      .list()
      .map((manifestItem) => manifestItem.token);

    assert.strictEqual(tokens.length, 2);
    assert.ok(tokens.includes('DbPool'));
    assert.ok(tokens.includes('RequestContext'));
  });

  it('lists a shadowed token once, preferring the child', () => {
    const { container: root } = new Kado();
    root.register([{ token: 'Env', useValue: 'prod' }]);

    const child = root.createChildContainer();
    child.register([{ token: 'Env', useValue: 'test' }]);

    const envItems = child
      .list()
      .filter(
        (manifestItem) => manifestItem.token === 'Env',
      );

    assert.deepStrictEqual(envItems, [
      { token: 'Env', useValue: 'test' },
    ]);
  });

  it('lists an inherited ContainerScoped token only once', () => {
    const { container: root } = new Kado();
    class Svc {}
    root.register([
      {
        token: 'Svc',
        useClass: Svc,
        scope: scope.ContainerScoped,
      },
    ]);

    // `createChildContainer` copies the ContainerScoped item into
    // the child, so it lives in both maps - `list()` must dedupe.
    const child = root.createChildContainer();

    const svcItems = child
      .list()
      .filter(
        (manifestItem) => manifestItem.token === 'Svc',
      );

    assert.strictEqual(svcItems.length, 1);
  });
});
