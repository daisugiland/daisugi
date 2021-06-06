import { fnv1a } from './fnv1a';
import { Context } from './oza';

export function setCache() {
  return function (context: Context) {
    let entityTag = context.response.headers.etag;

    if (entityTag) {
      return context;
    }

    // RFC 2616 (HTTP/1.1)

    const statusCode = context.response.statusCode;

    if (statusCode < 200 || statusCode >= 300) {
      return context;
    }

    const method = context.request.method;

    if (method !== 'GET' && method !== 'HEAD') {
      return context;
    }

    entityTag = fnv1a(context.response.body);
    context.response.headers.etag = entityTag;

    // TODO: Add Last-Modified
    // TODO: if-modified-since fresh

    if (
      context.response.headers['if-none-match'] ===
      entityTag
    ) {
      context.response.statusCode = 304;

      delete context.response.headers['content-type'];
      delete context.response.headers['content-length'];
      delete context.response.headers['transfer-encoding'];
    }

    return context;
  };
}

// Useful with versioned statics.
export function setInfiniteCache(context: Context) {
  context.response.headers['cache-control'] =
    'max-age=31536000';

  return context;
}
