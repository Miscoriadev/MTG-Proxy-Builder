import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

/**
 * Vite plugin to proxy Google Drive image requests in development.
 * drive.google.com/uc?export=view does 302 redirects to googleusercontent.com,
 * which the standard http-proxy can't follow. Node's fetch follows redirects
 * natively so we use a custom middleware instead.
 */
function gdriveProxy(): Plugin {
  return {
    name: 'gdrive-proxy',
    configureServer(server) {
      server.middlewares.use('/gdrive-images', async (req, res) => {
        try {
          const url = 'https://drive.google.com' + req.url;
          const response = await fetch(url, { redirect: 'follow' });

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Drive proxy error: ${response.status}`);
            return;
          }

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          const buffer = Buffer.from(await response.arrayBuffer());
          res.end(buffer);
        } catch (err) {
          res.statusCode = 502;
          res.end('Drive proxy fetch failed');
        }
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), gdriveProxy()],
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
