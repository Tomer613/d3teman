// Single source of truth for the community's identity. Safe to import from
// both Server and Client Components (no server-only APIs).

export const COMMUNITY_NAME = "קהילת קודש תימן רמה ד-3";
export const COMMUNITY_CITY = "בית שמש";
export const COMMUNITY_ADDRESS_LINE = COMMUNITY_CITY; // update once a street address is provided
export const COMMUNITY_TAGLINE = "פורטל החברים והגבאות";

// Drop the real logo file at this path (public/logo.png) - every usage of
// <CommunityLogo> and the newsletter email picks it up automatically with
// no further code changes.
export const LOGO_PATH = "/logo.png";
export const LOGO_INITIAL = COMMUNITY_NAME.trim()[0];
