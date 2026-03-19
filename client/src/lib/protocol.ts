export const CHALLENGE_START = new Date("2026-04-15T12:00:00Z");
export const CHALLENGE_END   = new Date("2026-08-15T12:00:00Z");

// Registration closes 2 days after challenge starts
export const REGISTRATION_CUTOFF = new Date(CHALLENGE_START.getTime() + 2 * 24 * 60 * 60 * 1000);
