/**
 * Utility to convert absolute backend media URLs to local proxy relative paths.
 * This is necessary to bypass Cloudflare Bot protection WAF rules which block
 * direct requests from client browsers / Vercel without x-vercel-signature header.
 */
export function getMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If the url is already relative or a blob/data URI, return it as-is
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/media/')) {
      return parsed.pathname; // returns "/media/..."
    }
  } catch (e) {
    // Fallback if URL parsing fails but contains /media/
    const mediaIdx = url.indexOf('/media/');
    if (mediaIdx !== -1) {
      return url.substring(mediaIdx);
    }
  }

  return url;
}
