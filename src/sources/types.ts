import { StremioStream } from '../services/streamService';

export interface MovieSource {
  name: string;
  getStreams(type: string, id: string): Promise<StremioStream[]>;
}
