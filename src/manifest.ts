import { ADDON_ID } from './config';

export const manifest = {
  id: ADDON_ID,
  version: "1.0.0",
  name: "asmallcinema",
  description: "A Stremio addon for asmallcinema.",
  resources: ["stream"],
  types: ["movie", "series"],
  catalogs: []
};
