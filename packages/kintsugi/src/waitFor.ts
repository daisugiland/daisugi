import { promisify } from 'util';

export const waitFor = promisify(setTimeout);
