import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: './public/index.html',
  },
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },
  output: {
    distPath: {
      root: 'build',
    },
    // Copy public assets
    copy: [
      {
        from: 'public',
        to: '.',
        globOptions: {
          ignore: ['**/index.html'],
        },
      },
    ],
  },
  server: {
    port: 3000,
    open: true,
  },
  dev: {
    // Enable fast refresh for React
    hmr: true,
  },
  performance: {
    // Optimize bundle size
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
});