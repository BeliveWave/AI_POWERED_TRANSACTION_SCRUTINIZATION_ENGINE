import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  resolve: {
    alias: {
      'dom-helpers/addClass': 'dom-helpers/esm/addClass',
      'dom-helpers/removeClass': 'dom-helpers/esm/removeClass',
    },
  },
});
