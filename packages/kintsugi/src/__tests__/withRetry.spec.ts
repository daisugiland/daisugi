import { withRetry } from "../withRetry.js";
import { result } from "../result.js";

it(
  "should return expected response",
  async () => {
    async function fn() {
      return result.ok("ok");
    }

    const fnWithRetry = withRetry(fn);

    const response = await fnWithRetry();

    expect(response.value).toEqual("ok");
  },
);
