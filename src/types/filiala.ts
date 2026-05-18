export const FILIALAS = ["1BN1", "1BV1"] as const;

export type FilialaCode = (typeof FILIALAS)[number];
