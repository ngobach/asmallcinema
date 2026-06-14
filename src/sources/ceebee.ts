import { StremioStream } from '../services/streamService';
import { MovieSource, StreamRequest } from './types';

export const ceebeeSource: MovieSource = {
  name: "CeeBee",
  async getStreams(req: StreamRequest): Promise<StremioStream[]> {
    if (req.type === 'movie') {
      // Provide CeeBee movie streams
      return [
        {
          title: "[CeeBee] Big Buck Bunny (HLS stream)",
          url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        },
        {
          title: "[CeeBee] Big Buck Bunny (MP4 direct)",
          url: "https://www.w3schools.com/html/mov_bbb.mp4"
        }
      ];
    }

    if (req.type === 'series') {
      // Provide CeeBee series stream stub using parsed season and episode
      return [
        {
          title: `[CeeBee] Series Stream S${req.season}E${req.episode} (HLS)`,
          url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        }
      ];
    }

    return [];
  }
};
