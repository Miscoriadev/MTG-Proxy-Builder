# CLAUDE.md

This file contains instructions for Claude Code when working on this project.

## Application Overview

**MTG Proxy Builder** is a web application for creating custom Magic: The Gathering proxy cards. Users can search for cards, customize borders and artwork, and download print-ready images.

### Tech Stack
- **React 19** + **TypeScript 5** + **Vite 7**
- **HTML5 Canvas** for card rendering
- **Scryfall API** for card data and search

### Key Components

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component, loads configuration data |
| `src/components/CardBuilder/CardBuilder.tsx` | Main UI orchestrator with preview and controls |
| `src/components/CardPreview/CardCanvas.tsx` | Canvas rendering with drag-to-pan and scroll-to-zoom |
| `src/components/Controls/` | UI controls (card search, border/background/DPI selectors) |
| `src/hooks/useCardBuilder.ts` | Central state management for selections and transforms |
| `src/services/scryfallApi.ts` | Throttled Scryfall API wrapper |
| `src/utils/canvasRenderer.ts` | Core rendering engine (text, symbols, images) |
| `src/utils/manaParser.ts` | Parses mana cost strings into symbol objects |

### Data Files (in `public/data/`)
- `borders.json` - Border configurations with text positions and image paths
- `backgrounds.json` - Custom artwork per card
- `symbols.json` - Mana symbol SVG URIs

### Features
- Debounced card search via Scryfall autocomplete
- Multiple border styles with automatic color detection
- Drag-to-pan and scroll-to-zoom artwork positioning
- DPI selection for print quality (300-600+)
- Dynamic text rendering with mana symbol substitution

## CORS Proxy Worker

The app uses a Cloudflare Worker to proxy Scryfall images with proper CORS headers for canvas rendering.

### Worker Setup (one-time)
```bash
cd worker
npm install
npx wrangler login  # Authenticate with Cloudflare
npm run deploy      # Deploy the worker
```

After deployment, note the worker URL (e.g., `https://mtg-proxy-builder-cors.YOUR_SUBDOMAIN.workers.dev`).

### Environment Variables
For local production builds, create a `.env.production` file:
```
VITE_CORS_PROXY_URL=https://mtg-proxy-builder-cors.YOUR_SUBDOMAIN.workers.dev
```

For GitHub Actions deployment, add the secret in GitHub:
1. Go to repository Settings > Secrets and variables > Actions
2. Add a new secret named `VITE_CORS_PROXY_URL` with your worker URL

## Deployment Workflow

When the user says "deploy" or asks to deploy the application:

1. Merge `main` into `production`:
   ```bash
   git checkout production
   git merge main
   ```

2. Push the changes to trigger the GitHub Actions deployment:
   ```bash
   git push
   ```

3. Switch back to `main` branch:
   ```bash
   git checkout main
   ```

The GitHub Pages deployment is triggered automatically when changes are pushed to the `production` branch.
