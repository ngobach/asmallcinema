import { ADDON_ID, ADDON_NAME } from './config';

export const manifest = {
  id: ADDON_ID,
  version: "1.0.0",
  name: ADDON_NAME,
  description: "A Stremio addon for asmallcinema.",
  resources: ["stream"],
  types: ["movie", "series"],
  catalogs: []
};
