// English placeholders for the news page while its wording is agreed; they
// move into i18n/strings.ts (all 7 languages) before this ships.
export const NEWS_COPY = {
  title: 'News',
  latest: 'Latest',
  readSource: 'Read the full story at {source}',
  photoCredit: 'Photo: {author}, {license}',
  opiniosTitle: 'Polls about this story',
  opiniosEmpty: 'Nobody has asked about this yet.',
  opiniosMore: 'Have another question about it?',
  opiniosCta: 'Ask the world about this',
  moreFrom: 'More from {country}',
  end: 'That is everything from the last 7 days.',
  empty: 'No news for these filters in the last 7 days.',
  openCountry: 'Open {country}',
} as const;

export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}
