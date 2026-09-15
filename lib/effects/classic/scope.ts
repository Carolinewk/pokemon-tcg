/** English expansion sequence supported through Neo Genesis (promotional sets are separate). */
export const CLASSIC_SETS = [
  "base1",
  "base2",
  "base3",
  "base4",
  "base5",
  "gym1",
  "gym2",
  "neo1",
] as const;

export function isClassicSet(setId: string) {
  return (CLASSIC_SETS as readonly string[]).includes(setId);
}
