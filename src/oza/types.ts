import * as http from 'http';

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
    output: string;
  };
}
