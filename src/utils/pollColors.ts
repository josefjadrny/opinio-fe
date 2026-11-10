// The nine answer colours an author can pick (3x3 picker in the add form), in
// picker order. Kept in sync with opinio-api src/data/pollColors.ts, which
// checks a pick and fills the rest. Slots 1-2 are the brand red and green, the
// default for a new poll's first two answers. Orange is left out - it is the
// NEW/hot signal. Checked on the card surface #16213e: every colour >= 3:1,
// every pair >= 15 OKLab apart for normal vision. Red/green and blue/purple
// are close for colour-blind readers, which is why a bar always carries its
// answer's text. Text never takes these colours.
export const OPTION_COLORS = [
  '#ef4444', '#22c55e', '#3b82f6',
  '#facc15', '#a855f7', '#f472b6',
  '#22d3ee', '#0d9488', '#e2e8f0',
] as const;

// Fill order for answers the author did not pick a colour for: blue/purple
// (the colour-blind pair) are kept apart for as long as possible.
export const DEFAULT_COLOR_ORDER = ['#ef4444', '#22c55e', '#3b82f6', '#facc15', '#f472b6', '#22d3ee', '#a855f7', '#0d9488', '#e2e8f0'];

/** The first default colour not in `used`. */
export function nextFreeColor(used: string[]): string {
  return DEFAULT_COLOR_ORDER.find((c) => !used.includes(c)) ?? DEFAULT_COLOR_ORDER[0];
}

/** optionId -> colour, for views that only hold option ids (map, results). */
export function colorById(options: { id: string; color: string }[]): Map<string, string> {
  return new Map(options.map((o) => [o.id, o.color]));
}

/** How far a country's fill travels from the map's neutral base toward the
 *  winning answer's colour when it leads by a wide margin. Under 1 on purpose:
 *  the picked colours are tuned for thin bars and dots, and as a filled area on
 *  the dark map the pure red/green glare. Bars, dots and the legend keep the
 *  exact pick, so the link stays clear. */
export const MAP_MAX_TINT = 0.78;
