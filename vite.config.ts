import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/mtg-proxy-builder/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/scryfall-images': {
        target: 'https://cards.scryfall.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/scryfall-images/, ''),
      },
      '/scryfall-symbols': {
        target: 'https://svgs.scryfall.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/scryfall-symbols/, ''),
      },
    },
  },
})
