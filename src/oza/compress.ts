import * as zlib from 'zlib';
import { pipeline, Readable } from 'stream';

import { Context } from './types';

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

export function compress() {
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

  return function (context: Context) {
    // const threshold = 200;

    let payload = context.response.output;

    if (!payload) {
      return context;
    }

    /*
  const responseEncoding = context.rawResponse.getHeader('Content-Encoding');

  if (responseEncoding === 'identity') {
    // response is already compressed
    return context;
  }

  if (responseEncoding === '*') {
    // Compress Gzip
    return context;
  }
  */

    const acceptEncoding =
      context.request.headers['accept-encoding'];
    const contentEncoding = negotiateContentEncoding(
      acceptEncoding,
      nameToConfig,
    );

    if (!contentEncoding) {
      return context;
    }

    const config = nameToConfig[contentEncoding.name];

    if (typeof payload === 'string') {
      /*
    if (Buffer.byteLength(payload) < threshold) {
      return context;
    }
    */
      // TODO: Rewrite
      // payload = intoStream(payload);
      payload = Readable.from([payload]);
    }

    context.response.headers['content-encoding'] =
      contentEncoding.name;
    delete context.response['content-length'];

    // Add vary.

    context.response.output = pipeline(
      payload,
      contentEncoding.quality
        ? config.createCompressor(contentEncoding.quality)
        : config.defaultCompressor,
      function (error) {
        console.log('pipe finished', error);
      },
    );

    return context;
  };
}
