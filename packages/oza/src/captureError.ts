import {
  FAIL_EXCEPTION_CODE,
  Handler,
  Toolkit,
} from '@daisugi-poc/daisugi';
import { Context } from './types';

export function captureError(userHandler: Handler) {
  function handler(context: Context, toolkit: Toolkit) {
    try {
      const result = toolkit.next;

      if (
        result.isFailure &&
        result.error.code === FAIL_EXCEPTION_CODE
      ) {
        return userHandler(result.error.value);
      }

      if (context.response.statusCode >= 500) {
        return userHandler(result.error.value);
      }

      return context;
    } catch (error) {
      console.log(error);

      return userHandler(context);
    }
  }

  handler.meta = {
    injectToolkit: true,
  };

  return handler;
}
