import { Context } from './types';
import {
  get,
  post,
  put,
  patch,
  routeDelete,
  all,
  notFound,
} from './router';
import { validate } from './validate';
import { createWebServer } from './webServer';

export { Context as Context };

export function kyoto() {
  return {
    createWebServer,
    get,
    post,
    put,
    patch,
    routeDelete,
    all,
    notFound,
    validate,
  };
}
