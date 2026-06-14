import { resolveAllStreams } from '../sources';

export interface StremioStream {
  title: string;
  url: string;
  behaviorHints?: {
    notWebReady?: boolean;
    proxyHeaders?: {
      request?: Record<string, string>;
    };
  };
}

/**
 * Resolves available streams for a given movie video ID by querying the registry
 */
export async function getStreamsForMovie(id: string): Promise<StremioStream[]> {
  return await resolveAllStreams('movie', id);
}
