import pluginTypescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import typescript from 'typescript';
import pkg from './package.json';

export default {
  input: pkg.source,
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    pluginTypescript({
      typescript,
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true,
    }),
    terser(),
  ],
};
