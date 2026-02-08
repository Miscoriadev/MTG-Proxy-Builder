/**
 * Cloudflare Worker - Image Proxy for MTG Proxy Builder
 *
 * Proxies image requests to Scryfall with proper CORS headers
 * to allow canvas rendering in the browser.
 */

export interface Env {
  // Environment bindings can be added here if needed
}

const ALLOWED_ORIGINS = [
  'https://mtgproxies.tabletop.cloud',
  'https://miscoriadev.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

const ALLOWED_DOMAINS = [
  'cards.scryfall.io',
  'svgs.scryfall.io',
  'drive.google.com',
];

function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '';

  // Allow any origin in development, check against allowlist in production
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain => parsed.hostname === domain);
  } catch {
    return false;
  }
}

function getCacheHeaders(imageUrl: string): string {
  if (imageUrl.includes('drive.google.com')) {
    // Drive uploads are immutable — cache aggressively
    return 'public, max-age=31536000, immutable';
  }
  // Scryfall images rarely change — cache for 7 days browser, 30 days edge
  return 'public, max-age=604800, s-maxage=2592000';
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', {
        status: 405,
        headers: getCorsHeaders(request),
      });
    }

    // Extract the image URL from query parameter
    const requestUrl = new URL(request.url);
    const imageUrl = requestUrl.searchParams.get('url');

    if (!imageUrl) {
      return new Response('Missing "url" query parameter', {
        status: 400,
        headers: getCorsHeaders(request),
      });
    }

    // Validate the URL is from an allowed domain
    if (!isAllowedUrl(imageUrl)) {
      return new Response('URL domain not allowed', {
        status: 403,
        headers: getCorsHeaders(request),
      });
    }

    try {
      // Fetch the image from the upstream server
      const imageResponse = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'MTGProxyBuilder/1.0 (https://github.com/Miscoriadev/MTG-Proxy-Builder)',
        },
      });

      if (!imageResponse.ok) {
        return new Response(`Failed to fetch image: ${imageResponse.status}`, {
          status: imageResponse.status,
          headers: getCorsHeaders(request),
        });
      }

      // Get the content type from the original response
      const contentType = imageResponse.headers.get('Content-Type') || 'image/jpeg';

      // Return the image with CORS headers and caching
      return new Response(imageResponse.body, {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': contentType,
          'Cache-Control': getCacheHeaders(imageUrl),
          'Vary': 'Origin',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new Response(`Proxy error: ${message}`, {
        status: 500,
        headers: getCorsHeaders(request),
      });
    }
  },
};
