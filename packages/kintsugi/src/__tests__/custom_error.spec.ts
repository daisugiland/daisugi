import assert from "node:assert";
import { describe, it } from "mocha";

import { CustomError } from "../custom_error.js";
import { Code } from "../code.js";

describe(
  "CustomError",
  () => {
    it(
      "should return object error with expected properties",
      () => {
        const customError = new CustomError("Custom message.", Code.Accepted);

        assert.strictEqual(customError.name, Code.Accepted);
        assert.strictEqual(customError.message, "Custom message.");
        assert.strictEqual(customError.code, Code.Accepted);
        assert(customError instanceof Error);
        assert(customError instanceof CustomError);

        assert.strictEqual(customError.toString(), "Accepted: Custom message.");
      },
    );
  },
);
