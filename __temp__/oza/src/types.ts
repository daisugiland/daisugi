import * as http from 'node:http';
import { Stream } from 'node:stream';

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
    body: string | Stream | Buffer;
    headers: Record<string, any>;
  };
  sendFile(path: string): void;
}
