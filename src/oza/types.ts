import * as http from 'http';
import { Readable } from 'stream';

export interface Context {
  rawRequest: http.IncomingMessage;
  rawResponse: http.ServerResponse;
  request: {
    url: string;
    matchedRoutePath: string;
    params: Record<string, any>;
    headers: Record<string, any>;
    querystring: Record<string, any>;
    body: Record<string, any>;
    method: string;
  };
  response: {
    statusCode: number;
    body: string | Readable;
    headers: Record<string, string>;
  };
}
