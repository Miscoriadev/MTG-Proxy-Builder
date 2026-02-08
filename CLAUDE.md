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
| `src/components/BorderEditor/BorderEditor.tsx` | Border configuration editor with live preview |
| `src/components/GoogleDriveDialog/` | Modal dialog for Google Drive sign-in and image upload |
| `src/components/Snackbar/` | Reusable toast notification system (SnackbarProvider + useSnackbar) |
| `src/hooks/useCardBuilder.ts` | Central state management for selections and transforms |
| `src/hooks/useBorderEditor.ts` | Border editor state, localStorage persistence, import/export |
| `src/hooks/useGoogleDrive.ts` | Google Drive OAuth, file upload, sharing, and folder management |
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
- Custom border editor with live preview

### Border Editor

The Border Editor (`/editor` route) allows users to create and customize border configurations with a visual interface.

**Key functionality:**
- Create new borders based on the "classic" template
- Import/export border configs as JSON files
- Drag-and-resize text position boxes on the canvas
- Configure text properties: font, size, color, alignment (horizontal & vertical)
- Set art position (center point and scale)
- Configure border images per mana color (W/U/B/R/G/C)

**Storage:**
- Custom borders are auto-saved to localStorage (`mtg-proxy-builder-custom-borders`)
- Each border gets a unique UUID on creation
- Custom borders appear in the Card Builder's border selector

**Components:**
- `EditorCanvas` - Interactive canvas with draggable text position overlays
- `TextboxOverlay` - Draggable/resizable text position control
- `panels/` - Settings panels (GeneralInfo, ArtPosition, BorderImages, TextPosition)

### Snackbar

Reusable toast notification system via React Context. Wrap the app in `<SnackbarProvider>` (done in `main.tsx`), then call `showSnackbar(message, type?)` from any component via `useSnackbar()`. Supports `success`, `error`, and `info` types. Auto-dismisses after 3 seconds.

### Google Drive Upload

Users can upload custom images (borders, artwork) to their own Google Drive for hosting. Uses Google Identity Services for client-side OAuth2 with the `drive.file` scope (only files created by this app).

**Flow:** Sign in → upload file → share publicly → return `drive.google.com/uc?export=view` URL.

**Key details:**
- Upload buttons appear next to every image URL field in the Border Editor's Border Images panel
- When not signed in, upload buttons open a sign-in dialog; when signed in, they open the file picker directly
- Files are uploaded to a dedicated folder ("Uploads - mtgproxies.tabletop.cloud") with timestamped names
- Auth tokens are persisted in localStorage with expiry tracking
- Google Drive URLs are routed through the CORS proxy (`imageProxy.ts`) for canvas rendering
- Env vars: `VITE_GOOGLE_CLIENT_ID` (required), configured in `.env.local`

**Components:** `GoogleDriveDialog` (Header modal), `useGoogleDrive` hook, `BorderImagesPanel` (inline upload buttons + sign-in dialog)

## CORS Proxy Worker

The app uses a Cloudflare Worker to proxy images (Scryfall + Google Drive) with proper CORS headers for canvas rendering.

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

## Design Files

When working on `.pen` files in the `designs/` directory, read `designs/README.md` for important reference information about export visibility settings and element IDs.
