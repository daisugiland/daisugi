import * as zlib from "zlib";
import { Readable } from "stream";

import { Context } from "./types.js";

function getBodyStream(body, compress) {
  let bodyStream = body;

  if (typeof body === "string") {
    // One chunk body.
    // TODO: create Readable
    bodyStream = Readable.from([body]);
  }

  return bodyStream.pipe(compress());
}

function getNegotiatedEncoding(acceptEncoding, configByEncoding) {
  // Based on https://github.com/SerayaEryn/encoding-negotiator
  return acceptEncoding
    .split(",")
    .map((directive) => {
      const [name, qValue] = directive.trim().split(";");
      let priority = 1;

      if (qValue) {
        const value = qValue.split("=")[1];

        if (value) {
          priority = parseFloat(value);
        }
      }

      return [name, priority];
    })
    .sort(
      ([name1, priority1], [name2, priority2]) => {
        if (priority1 === priority2) {
          if (
            configByEncoding[name1] &&
            configByEncoding[name2] &&
            configByEncoding[name2].priority < configByEncoding[name1].priority
          ) {
            return -1;
          } else {
            return 1;
          }
        }

        return priority2 - priority1;
      },
    )
    .find(([name, priority]) => configByEncoding[name] && priority !== 0);
}

function process(context: Context, config) {
  const vary = context.response.headers["vary"];
  const body = context.response.body;

  context.response.body = getBodyStream(body, config.compress);
  context.response.headers["vary"] = buildHeader(vary, "accept-encoding");
  context.response.headers["content-encoding"] = config.name;
  delete context.response["content-length"];
}

function buildHeader(currentHeader, header) {
  if (!currentHeader) {
    return header;
  }

  if (currentHeader === header) {
    return currentHeader;
  }

  if (Array.isArray(currentHeader)) {
    if (currentHeader.includes(header)) {
      return currentHeader;
    }

    return [...currentHeader, header];
  }

  return [currentHeader, header];
}

export function compress() {
  const configByEncoding = {
    br: {
      name: "br",
      compress() {
        return zlib.createBrotliCompress({
          [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
        });
      },
      priority: 1,
    },
    gzip: {
      name: "gzip",
      compress() {
        return zlib.createGzip({ level: 1 });
      },
      priority: 0.9,
    },
    deflate: {
      name: "deflate",
      compress() {
        return zlib.createDeflate({ level: 1 });
      },
      priority: 0.8,
    },
  };

  return function (context: Context) {
    if (context.response.body === null) {
      return context;
    }

    const contentEncoding = context.request.headers["content-encoding"];

    if (contentEncoding && contentEncoding !== "identity") {
      // Already encoded.
      return context;
    }

    const acceptEncoding = context.request.headers["accept-encoding"];

    if (!acceptEncoding) {
      return context;
    }

    if (acceptEncoding === "*") {
      process(context, configByEncoding.gzip);

      return context;
    }

    const [encoding] = getNegotiatedEncoding(acceptEncoding, configByEncoding);

    const body = context.response.body;

    if (encoding) {
      if (typeof body === "string" && Buffer.byteLength(body) < 10) {
        return context;
      }

      if (Buffer.isBuffer(body) && body.byteLength < 10) {
        return context;
      }

      // TODO: Convert entityTag to weak.

      process(context, configByEncoding[encoding]);
    }

    return context;
  };
}
