/**
 * Converts image URLs to use the correct path for the deployment environment.
 * In development, uses Vite's proxy for Scryfall images.
 * In production, uses direct Scryfall URLs and prepends BASE_URL for local assets.
 */
export function proxyImageUrl(url: string): string {
  if (!url) return url;

  const isDev = import.meta.env.DEV;
  const baseUrl = import.meta.env.BASE_URL;

  // Handle Scryfall card images
  if (url.includes('cards.scryfall.io')) {
    if (isDev) {
      // Use Vite proxy in development
      const path = url.replace('https://cards.scryfall.io', '');
      return `/scryfall-images${path}`;
    }
    // In production, use direct URL (Scryfall allows CORS)
    return url;
  }

  // Handle Scryfall symbol SVGs
  if (url.includes('svgs.scryfall.io')) {
    if (isDev) {
      // Use Vite proxy in development
      const path = url.replace('https://svgs.scryfall.io', '');
      return `/scryfall-symbols${path}`;
    }
    // In production, use direct URL (Scryfall allows CORS)
    return url;
  }

  // Handle local assets (starting with /) - prepend BASE_URL
  if (url.startsWith('/')) {
    return `${baseUrl}${url.slice(1)}`;
  }

  // Handle relative local assets (no leading /)
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
    return `${baseUrl}${url}`;
  }

  return url;
}
