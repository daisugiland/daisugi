<p align="center">
  <img alt="daisugi" src="https://user-images.githubusercontent.com/22574/125201112-fc787f00-e26d-11eb-8e70-569dbd6997e0.png" width="170">
</p>

<p align="center">
  Daisugi is a minimalist functional middleware engine.
</p>

<h2 align="center">Daisugi</h2>

Daisugi was created with the purpose of organizing your code in an understandable execution pipeline.
It provides flow execution mechanisms like `sequenceOf()` and `concurrentOf()`, as well as a hooks system that allows you to extend the capabilities of each middleware.

Daisugi is designed to solve the most demanding real-world use cases. E.g.: high performance HTTP servers, crons, real-time applications, scrapers, etc.

**Key aspects:**

- Functional by design, you write only functions (handlers)
- Core `sequenceOf()` and `concurrentOf()` flow execution methods, to compose your application pipelines
- Unique recursive composition, you always obtain a handler that can be included into a new pipeline
- Convenient system to personalize your handlers, by leveraging the `meta` property of the handler function
- Flexible hooks mechanism, that enables you to extend the behaviour of any handler
- Unique flow control mechanism via the `next()`, `stop()` and `jumpTo()` toolkit methods
- Small footprint, all you need in ~4Kb (_without_ compression)

## Handlers

A handler is just an async function with two parameters:

```js
const handler = async (ctx, toolkit) => {
  const { next, stop, jumpTo } = toolkit;

  ctx.demo = 'done';

  return next();
};
```

## Usage

```js
import { daisugi } from '@daisugi/daisugi';

const { sequenceOf, concurrentOf, compose } = daisugi();

const init = async (ctx, toolkit) => {
  ctx.init = true;
  await toolkit.next();
};

// ...

const fullProcess = sequenceOf([read, transform, write]);

const write = concurrentOf([writeToApi, writeToDisk]);

// ...

const app = compose([init, fullProcess, finish]);

const result = await app({ init: false });
```

## Hooks

(...)

### Global hooks usage

```js
import { daisugi } from '@daisugi/daisugi';

const hook = (handler, meta) => {
  return async (ctx, toolkit) => {
    // pre-hook action here
    const result = await handler(ctx, toolkit);
    // post-hook action here
    return result;
  };
};

const { sequenceOf, concurrentOf, compose } = daisugi([
  hook,
]);

// ...

const app = compose([init, fullProcess, finish]);

const result = await app();
```

### Handler hooks usage

```js
import { daisugi } from '@daisugi/daisugi';

const { sequenceOf, concurrentOf, compose } = daisugi();

const hook = (handler, meta) => {
  return async (ctx, toolkit) => {
    // pre-hook action here
    const result = await handler(ctx, toolkit);
    // post-hook action here
    return result;
  };
};

// ...

fullProcess.meta = {
  hooks: [hook],
};

const app = compose([init, fullProcess, finish]);

const result = await app();
```

## Examples

See the [examples](./examples) folder. You'll find how to:

- build a web server,
- build a scraper (sequential and concurrent),
- use custom hooks for debugging and tracing,
- ...

## FAQ

### Where does the name come from?

Daisugi is a Japanese forestry technique, originated in the 14th century, where specially planted cedar trees are pruned heavily to produce "shoots" that become perfectly uniform, straight and completely knot free lumber.

More info: https://twitter.com/wrathofgnon/status/1250287741247426565

## License

[MIT](LICENSE)
