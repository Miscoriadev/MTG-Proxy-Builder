/**
 * Converts external image URLs to use the local proxy to avoid CORS issues.
 * This is necessary for canvas operations that require image data access.
 */
export function proxyImageUrl(url: string): string {
  if (!url) return url;

  // Proxy Scryfall card images
  if (url.includes('cards.scryfall.io')) {
    const path = url.replace('https://cards.scryfall.io', '');
    return `/scryfall-images${path}`;
  }

  // Proxy Scryfall symbol SVGs
  if (url.includes('svgs.scryfall.io')) {
    const path = url.replace('https://svgs.scryfall.io', '');
    return `/scryfall-symbols${path}`;
  }

  // Return as-is for local or already-proxied URLs
  return url;
}
