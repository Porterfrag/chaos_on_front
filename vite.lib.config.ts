import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

const dirname = fileURLToPath(new URL('.', import.meta.url));

// Library build: compiles src/lib into a publishable bundle (demo excluded).
export default defineConfig({
  plugins: [react(), dts({ outDir: 'dist-lib', include: ['src/lib/**/*'] })],
  build: {
    outDir: 'dist-lib',
    lib: {
      entry: resolve(dirname, 'src/lib/index.ts'),
      name: 'chaosOnFront',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom', 'zustand', 'zustand/traditional'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM', zustand: 'zustand' },
      },
    },
  },
});
