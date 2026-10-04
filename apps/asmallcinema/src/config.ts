export const PORT = process.env.PORT || 3005;
export const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
export const ADDON_ID = process.env.ADDON_ID || "community.asmallcinema";
export const ADDON_NAME = process.env.ADDON_NAME || "ASC";
export const ADDON_HOME_PAGE = process.env.ADDON_HOME_PAGE || "https://ngobach.github.io/asmallcinema/";

/**
 * TMDB API key (v3) used as a fallback when Wikidata has no IMDb -> TMDB mapping.
 * Optional; without it only Wikidata is consulted.
 */
export const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

/**
 * Comma-separated source codenames to enable, e.g. "viki,vihi".
 * Unset or empty enables every registered source.
 */
export const ENABLED_SOURCES: string[] = [
  ...new Set(
    (process.env.ENABLED_SOURCES ?? '')
      .split(',')
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean)
  )
];
