import * as zlib from 'zlib';
import { pipeline, Readable } from 'stream';

import { Context } from './types';

/*
function negotiateContentEncoding(
  acceptEncoding,
  nameToConfig,
) {
  // Based on https://github.com/SerayaEryn/encoding-negotiator
  return acceptEncoding
    .split(',')
    .map((directive) => {
      const [name, qValue] = directive.trim().split(';');
      let quality = null;

      if (qValue) {
        const value = qValue.split('=')[1];

        if (value) {
          quality = parseFloat(value);
        }
      }

      return { name, quality };
    })
    .sort((a, b) => {
      // TODO: Change priority to config.
      if (a.quality === b.quality) {
        if (
          nameToConfig[a.name] &&
          nameToConfig[b.name] &&
          nameToConfig[a.name].priority <
            nameToConfig[b.name].priority
        ) {
          return -1;
        } else {
          return 1;
        }
      }

      return b.quality - a.quality;
    })
    .find((a) => nameToConfig[a.name] && a.quality !== 0);
}

  const nameToConfig = {
    br: {
      quality: 1,
      priority: 10,
      defaultCompressor: zlib.createBrotliCompress({
        [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
      }),
      createCompressor(quality) {
        return zlib.createBrotliCompress({
          [zlib.constants.BROTLI_PARAM_QUALITY]: quality,
        });
      },
      createDecompressor: zlib.createBrotliDecompress,
    },
    gzip: {
      quality: 1,
      priority: 20,
      defaultCompressor: zlib.createGzip({ level: 1 }),
      createCompressor(quality) {
        return zlib.createGzip({
          level: quality,
        });
      },
      createDecompressor: zlib.createGunzip,
    },
    deflate: {
      quality: 1,
      priority: 30,
      defaultCompressor: zlib.createDeflate({ level: 1 }),
      createCompressor(quality) {
        return zlib.createDeflate({ level: quality });
      },
      createDecompressor: zlib.createInflate,
    },
  };

    if (Buffer.byteLength(payload) < threshold) {
      return context;
    }
*/

function getBodyStream(body, compress) {
  let bodyStream = body;

  if (typeof body === 'string') {
    // One chunk body.
    bodyStream = Readable.from([body]);
  }

  return pipeline(bodyStream, compress, (error) => {
    if (error) {
      // TODO: Do something.
      console.log('ERROR', error);
    }
  });
}

function getEncodingToQuality(acceptEncoding) {
  return acceptEncoding
    .split(',')
    .reduce((encodingToQuality, directive) => {
      const [name, qValue] = directive.trim().split(';');
      let quality = null; // TODO: set to 1.

      if (qValue) {
        const value = qValue.split('=')[1];

        if (value) {
          quality = parseFloat(value);
        }
      }

      encodingToQuality[name] = quality;
    }, {});
}

// TODO: Vary could be an array.
function getVary(vary) {
  if (!vary) {
    return 'accept-encoding';
  }

  if (vary.include('accept-encoding')) {
    return vary;
  }

  return `${vary} accept-encoding`;
}

export function compress() {
  const gzipCompress = zlib.createGzip();
  const deflateCompress = zlib.createDeflate();
  const brotliCompress = zlib.createBrotliCompress();

  return function (context: Context) {
    const body = context.response.body;

    if (!body) {
      return context;
    }

    const contentEncoding =
      context.request.headers['content-encoding'];

    if (contentEncoding !== 'identity') {
      // Already encoded.
      return context;
    }

    const acceptEncoding =
      context.request.headers['accept-encoding'];

    if (!acceptEncoding) {
      return context;
    }

    const vary = context.response.headers['vary'];

    if (acceptEncoding === '*') {
      context.response.body = getBodyStream(
        body,
        gzipCompress,
      );
      context.response.headers['vary'] = getVary(vary);
      context.response.headers['content-encoding'] = 'gzip';
      delete context.response['content-length'];

      return context;
    }

    const encodingToQuality =
      getEncodingToQuality(acceptEncoding);

    if (encodingToQuality.br) {
      context.response.body = getBodyStream(
        body,
        brotliCompress,
      );
      context.response.headers['vary'] = getVary(vary);
      context.response.headers['content-encoding'] =
        'brotli';
      delete context.response['content-length'];

      return context;
    }

    if (encodingToQuality.gzip) {
      context.response.body = getBodyStream(
        body,
        gzipCompress,
      );
      context.response.headers['vary'] = getVary(vary);
      context.response.headers['content-encoding'] = 'gzip';
      delete context.response['content-length'];

      return context;
    }

    if (encodingToQuality.deflate) {
      context.response.body = getBodyStream(
        body,
        deflateCompress,
      );
      context.response.headers['vary'] = getVary(vary);
      context.response.headers['content-encoding'] =
        'deflate';
      delete context.response['content-length'];

      return context;
    }

    return context;
  };
}
