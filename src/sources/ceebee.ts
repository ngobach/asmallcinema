import { StremioStream } from '../services/streamService';
import { MovieSource } from './types';

export const ceebeeSource: MovieSource = {
  name: "CeeBee",
  async getStreams(type: string, id: string): Promise<StremioStream[]> {
    // Provide CeeBee source streams (labeled with [CeeBee])
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
};
