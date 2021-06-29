import { Stream } from 'stream';

export async function streamToBuffer(
  stream: Stream,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    let buffer = Array<any>();

    stream.on('data', (chunk) => buffer.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffer)));
    stream.on('error', (err) =>
      reject(`error converting stream - ${err}`),
    );
  });
}
