// English placeholders for the news page while its wording is agreed; they
// move into i18n/strings.ts (all 7 languages) before this ships.
export const NEWS_COPY = {
  title: 'News',
  allFilters: 'All countries · all categories',
  latest: 'Latest',
  readSource: 'Read the full story at {source}',
  photoCredit: 'Photo: {author}, {license}',
  opiniosTitle: 'Opinios on this story',
  opiniosEmpty: 'Nobody has weighed in yet.',
  opiniosMore: 'What do you think?',
  opiniosCta: 'Post your opinio',
  moreFrom: 'More from {country}',
  end: 'That is everything from the last 7 days.',
  empty: 'No news for these filters in the last 7 days.',
  openCountry: 'Open {country}',
} as const;

export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}
