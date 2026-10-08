import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  // @todo/shared ships TypeScript source, so bundle it into the API build.
  noExternal: ['@todo/shared'],
});
