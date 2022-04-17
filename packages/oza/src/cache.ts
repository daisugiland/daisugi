import { encToFNV1A } from "@daisugi/kintsugi";
import { Stream } from "stream";
import { Context } from "./oza.js";
import { streamToBuffer } from "./stream_to_buffer.js";
import { isStream } from "./utils.js";

export function setCache() {
  return async function (context: Context) {
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

    if (method !== "GET" && method !== "HEAD") {
      return context;
    }

    let body = context.response.body;

    if (isStream(body)) {
      body = await streamToBuffer(body as Stream);
    }

    // @ts-ignore
    entityTag = encToFNV1A(body);
    context.response.headers.etag = entityTag;

    // TODO: Add Last-Modified
    // TODO: if-modified-since fresh

    if (context.response.headers["if-none-match"] === entityTag) {
      context.response.statusCode = 304;

      delete context.response.headers["content-type"];
      delete context.response.headers["content-length"];
      delete context.response.headers["transfer-encoding"];
    }

    return context;
  };
}

// Useful with versioned statics.
export function setInfiniteCache(context: Context) {
  context.response.headers["cache-control"] = "max-age=31536000";

  return context;
}
