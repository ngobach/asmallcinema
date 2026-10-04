import { ADDON_ID, ADDON_NAME, PUBLIC_URL } from './config';

export const manifest = {
  id: ADDON_ID,
  version: "0.5.0",
  name: ADDON_NAME,
  description: "A Stremio addon for asmallcinema.",
  logo: `${PUBLIC_URL}/logo.png`,
  resources: ["stream"],
  types: ["movie", "series"],
  catalogs: []
};

