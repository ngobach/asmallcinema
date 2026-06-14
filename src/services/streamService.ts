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
 * Resolves available streams for a given movie video ID
 */
export function getStreamsForMovie(id: string): StremioStream[] {
  // Mock data representing available stream options
  return [
    {
      title: "Big Buck Bunny (HLS stream)",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    },
    {
      title: "Big Buck Bunny (MP4 direct)",
      url: "https://www.w3schools.com/html/mov_bbb.mp4"
    }
  ];
}
