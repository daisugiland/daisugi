import { Handler, Toolkit } from "@daisugi/daisugi";
import { Code } from "@daisugi/kintsugi";
import { Context } from "./types.js";

export function captureError(userHandler: Handler) {
	function handler(context: Context, toolkit: Toolkit) {
		try {
			const result = toolkit.next;

			if (result.isFailure && result.getError().code === Code.Fail) {
				return userHandler(result.getError().value);
			}

			if (context.response.statusCode >= 500) {
				return userHandler(result.getError().value);
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
