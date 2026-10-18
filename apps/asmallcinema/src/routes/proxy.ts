import { defineEventHandler, getQuery, setResponseHeaders, createError } from 'h3';
import { PUBLIC_URL } from '../config';
import { DEFAULT_USER_AGENT } from '../utils/browser';

/**
 * Derives a file extension for the proxy path from the target URL. Players such
 * as Stremio's Android ExoPlayer pick the media source from the URL path
 * extension, so proxied playlist URLs must end in ".m3u8" (or the original
 * segment extension) instead of a query-only URL.
 */
function pickExtension(targetUrl: string): string {
  try {
    const pathname = new URL(targetUrl).pathname;
    const base = pathname.split('/').filter(Boolean).pop() ?? '';
    const dot = base.lastIndexOf('.');
    if (dot > -1 && dot < base.length - 1) {
      const ext = base.slice(dot + 1).toLowerCase();
      if (/^[a-z0-9]{1,5}$/.test(ext)) {
        return ext;
      }
    }
  } catch {
    // Fall through to the default playlist extension
  }
  // URLs without an extension (e.g. VidHive's tokenized playlist path) are
  // playlists, so default to ".m3u8".
  return 'm3u8';
}

/**
 * Builds a proxy URL that preserves the target's media extension in the path,
 * so downstream players correctly detect the stream type.
 */
export function buildProxyUrl(targetUrl: string, referer?: string, userAgent?: string): string {
  const proxyUrl = new URL(`${PUBLIC_URL}/m3u8-proxy/stream.${pickExtension(targetUrl)}`);
  proxyUrl.searchParams.set('url', targetUrl);
  if (referer) {
    proxyUrl.searchParams.set('referer', referer);
  }
  if (userAgent) {
    proxyUrl.searchParams.set('userAgent', userAgent);
  }
  return proxyUrl.toString();
}

/**
 * Rewrites URLs inside a .m3u8 playlist file to route them through the local proxy.
 * Resolves relative URLs to absolute based on the parent URL, and appends the
 * required Referer and User-Agent parameters.
 */
function rewriteM3U8(content: string, parentUrl: string, referer?: string, userAgent?: string): string {
  const lines = content.split('\n');
  const rewrittenLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      return line;
    }

    // Check if the line is a comment or metadata tag
    if (trimmed.startsWith('#')) {
      // Rewrite any URI attributes in tags (e.g. #EXT-X-KEY or #EXT-X-MAP)
      const uriRegex = /URI="([^"]+)"/g;
      return trimmed.replace(uriRegex, (match, uriValue) => {
        try {
          const resolvedUrl = new URL(uriValue, parentUrl).toString();
          return `URI="${buildProxyUrl(resolvedUrl, referer, userAgent)}"`;
        } catch (e) {
          return match;
        }
      });
    }

    // The line is a direct URL resource (sub-playlist or video segment)
    try {
      const resolvedUrl = new URL(trimmed, parentUrl).toString();
      return buildProxyUrl(resolvedUrl, referer, userAgent);
    } catch (e) {
      return line;
    }
  });

  return rewrittenLines.join('\n');
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const targetUrl = query.url as string;
  const referer = query.referer as string;
  const userAgent = (query.userAgent as string) || DEFAULT_USER_AGENT;

  if (!targetUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing "url" query parameter'
    });
  }

  const headers: Record<string, string> = {
    'User-Agent': userAgent
  };
  if (referer) {
    headers['Referer'] = referer;
  }

  try {
    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to fetch target stream: ${response.statusText}`
      });
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

    // Set CORS headers for player clients and match original content type
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': contentType
    });

    const isPlaylist = targetUrl.toLowerCase().includes('.m3u8') || 
                       contentType.includes('mpegurl') || 
                       contentType.includes('mpegURL');

    if (isPlaylist) {
      const text = await response.text();
      return rewriteM3U8(text, targetUrl, referer, userAgent);
    } else {
      // Stream segment or other resources directly
      return response.body;
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Proxy failed to resolve: ${error.message}`
    });
  }
});
