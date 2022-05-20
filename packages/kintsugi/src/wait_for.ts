import { promisify } from 'node:util';

export const waitFor = promisify(setTimeout);
