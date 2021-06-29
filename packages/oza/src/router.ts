import { match } from 'path-to-regexp';

import { stopPropagationWith } from '@daisugi/daisugi';
import { Context } from './types';

function createRouteHandler(
  routePath: string,
  routeMethod: string,
) {
  const matchFn = match(routePath, {
    decode: decodeURIComponent,
  });

  return function (context: Context) {
    if (context.request.matchedRoutePath) {
      return stopPropagationWith(context);
    }

    if (
      routeMethod !== 'ALL' &&
      context.request.method !== routeMethod
    ) {
      return stopPropagationWith(context);
    }

    const matchedUrl = matchFn(context.request.url);

    if (!matchedUrl) {
      return stopPropagationWith(context);
    }

    // @ts-ignore
    context.request.params = matchedUrl.params;
    context.request.matchedRoutePath = routePath;
    context.response.statusCode = 200;

    return context;
  };
}

export function get(path: string) {
  return createRouteHandler(path, 'GET');
}

export function post(path: string) {
  return createRouteHandler(path, 'POST');
}

export function put(path: string) {
  return createRouteHandler(path, 'PUT');
}

export function patch(path: string) {
  return createRouteHandler(path, 'PATCH');
}

export function routeDelete(path: string) {
  return createRouteHandler(path, 'DELETE');
}

export function all(path: string) {
  return createRouteHandler(path, 'ALL');
}

export function notFound(context: Context) {
  if (context.request.matchedRoutePath) {
    return stopPropagationWith(context);
  }

  context.response.statusCode = 404;

  return context;
}
