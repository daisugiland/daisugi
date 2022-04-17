export class CustomError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);

    this.name = code;

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
