import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function findFilesByName(startPath: string) {
  const stack = [startPath];
  const foundFiles = [];
  while (stack.length > 0) {
    const currentPath = stack.pop() as string;
    const files = readdirSync(currentPath);
    for (const fileName of files) {
      const filePath = join(currentPath, fileName);
      const fileStats = statSync(filePath);
      if (fileStats.isDirectory()) {
        if (!['node_modules', 'dist'].includes(fileName)) {
          stack.push(filePath);
        }
      } else {
        foundFiles.push(filePath);
      }
    }
  }
  return foundFiles;
}

const files = findFilesByName('./');
console.log(files);
