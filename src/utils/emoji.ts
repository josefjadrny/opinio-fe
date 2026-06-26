// Strips emoji from a string. Used to keep the short statement headline
// text-only - emoji are allowed in the body (description) only.
//
// Matches pictographic emoji plus the pieces that build compound emoji: skin-
// tone modifiers, regional-indicator pairs (flags), the zero-width joiner
// (U+200D) used in family/profession sequences, the emoji variation selector
// (U+FE0F), and the enclosing keycap (U+20E3). Plain digits / # / * are
// deliberately NOT matched, so "Plan B" or "Top 10" survive untouched (only
// their emoji presentation markers, if any, are removed).
// Alternation rather than a character class: the zero-width / combining members
// (U+200D, U+FE0F, U+20E3) trip eslint's no-misleading-character-class when put
// in a [...] class, but as alternatives they match the same single code points.
const EMOJI_RE = new RegExp(
  '\\p{Extended_Pictographic}|\\p{Emoji_Modifier}|\\p{Regional_Indicator}|\\u200D|\\uFE0F|\\u20E3',
  'gu',
);

export function stripEmoji(value: string): string {
  return value.replace(EMOJI_RE, '');
}
