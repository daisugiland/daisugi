import { Handler, Toolkit } from "@daisugi/daisugi";
import { Code } from "@daisugi/kintsugi";
import { Context } from "./types.js";

export function captureError(userHandler: Handler) {
  function handler(context: Context, toolkit: Toolkit) {
    try {
      const result = toolkit.next;

      if (result.isFailure && result.error.code === Code.Fail) {
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

  handler.meta = { injectToolkit: true };

  return handler;
}
