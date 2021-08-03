// @ts-ignore
const util = jest.requireActual('util'); // get the real util

const realPromisify = util.promisify; // capture the real promisify

util.promisify = (...args) => {
  if (args[0] === setTimeout) {
    // return a mock if promisify(setTimeout)
    return (time) =>
      new Promise((resolve) => {
        setTimeout(resolve, time);
      });
  }
  return realPromisify(...args); // ...otherwise call the real promisify
};

module.exports = util;
