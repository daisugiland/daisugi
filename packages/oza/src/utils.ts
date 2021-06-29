// Duck type expression.
export function isStream(somethingCouldBeStream) {
  return typeof somethingCouldBeStream.pipe === 'function';
}
