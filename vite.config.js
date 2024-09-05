import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src', // Set to the folder where your index.js is located, if applicable
  server: {
    port: 5173,  // The port Vite runs on
  },
  build: {
    outDir: '../dist', // Output directory for the build
  },
});
