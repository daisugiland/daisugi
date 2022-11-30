export function waitFor(time: number) {
  return new Promise((callback) =>
    setTimeout(callback, time),
  );
}
