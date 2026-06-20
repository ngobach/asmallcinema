import { resolveAllStreams } from '../sources';
import { StreamRequest } from '../sources/types';

export interface StremioStream {
  title: string;
  url: string;
  behaviorHints?: {
    notWebReady?: boolean;
    bingeGroup?: string;
    proxyHeaders?: {
      request?: Record<string, string>;
    };
  };
}

/**
 * Resolves available streams for a given media request by querying the registry
 */
export async function getStreams(req: StreamRequest): Promise<StremioStream[]> {
  return await resolveAllStreams(req);
}
