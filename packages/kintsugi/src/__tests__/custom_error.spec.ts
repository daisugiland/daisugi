import { CustomError } from "../custom_error.js";
import { Code } from "../code.js";

describe(
  "CustomError",
  () => {
    it(
      "should return object error with expected properties",
      () => {
        const customError = new CustomError("Custom message.", Code.Accepted);

        expect(customError.name).toBe(Code.Accepted);
        expect(customError.message).toBe("Custom message.");
        expect(customError.code).toBe(Code.Accepted);
        expect(customError instanceof Error).toBeTruthy();
        expect(customError instanceof CustomError).toBeTruthy();

        expect(customError.toString()).toBe("Accepted: Custom message.");
      },
    );
  },
);
