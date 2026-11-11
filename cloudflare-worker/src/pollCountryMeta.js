// Title + meta description of one poll seen from one country (/p/:id/c/:code).
// Imported by the worker (server-rendered head) AND the SPA (the head it sets on
// navigation), so both always say the same thing.
//
// Every template starts with the country name and a colon: the name tables
// only hold the nominative, and "people in Czechia" needs a case ending in
// Czech and Polish (v Cesku, w Czechach) that we do not have.
//
// The description is the country's answers, biggest first, filled up to
// ~155 chars (what Google shows). Answers that do not fit become "and more".
// "The world picked X" is added only when the world's winner differs from the
// country's - when they agree it says nothing - and it goes in before the tail
// answers. Numbers are live: Google keeps whatever it read at its last crawl.

const MAX_DESCRIPTION = 155;

/** Below this many votes from a country the page is thin: the sitemap leaves
 *  it out and the canonical points at the poll. Keep equal to the API's
 *  SITEMAP_POLL_COUNTRY_MIN_VOTES. */
export const POLL_COUNTRY_MIN_VOTES = 5;

// votes: the count as it follows "of" - genitive in cs/pl ("z 5 hlasu").
const T = {
  en: {
    title: '{country}: {question}',
    lead: '{country}: {answer} leads with {pct}% of {votes}',
    tie: '{country}: {answers} tie at {pct}% each of {votes}',
    then: ', then ', and: ' and ', more: ' and more',
    world: ' The world picked {answer}.',
    none: '{country}: nobody there has voted on this yet.',
    votes: { one: '{n} vote', other: '{n} votes' },
  },
  cs: {
    title: '{country}: {question}',
    lead: '{country}: vede {answer} s {pct}% z {votes}',
    tie: '{country}: {answers} mají shodně po {pct}% z {votes}',
    then: ', pak ', and: ' a ', more: ' a další',
    world: ' Svět zvolil {answer}.',
    none: '{country}: odtud zatím nikdo nehlasoval.',
    votes: { one: '{n} hlasu', other: '{n} hlasů' },
  },
  es: {
    title: '{country}: {question}',
    lead: '{country}: lidera {answer} con el {pct}% de {votes}',
    tie: '{country}: {answers} empatan con el {pct}% de {votes}',
    then: ', luego ', and: ' y ', more: ' y más',
    world: ' El mundo eligió {answer}.',
    none: '{country}: todavía nadie de allí ha votado.',
    votes: { one: '{n} voto', other: '{n} votos' },
  },
  de: {
    title: '{country}: {question}',
    lead: '{country}: {answer} führt mit {pct}% von {votes}',
    tie: '{country}: {answers} liegen mit je {pct}% von {votes} gleichauf',
    then: ', dann ', and: ' und ', more: ' und weitere',
    world: ' Die Welt wählte {answer}.',
    none: '{country}: von dort hat noch niemand abgestimmt.',
    votes: { one: '{n} Stimme', other: '{n} Stimmen' },
  },
  fr: {
    title: '{country} : {question}',
    lead: '{country} : {answer} en tête avec {pct}% de {votes}',
    tie: '{country} : {answers} à égalité avec {pct}% chacun de {votes}',
    then: ', puis ', and: ' et ', more: ' et d\'autres',
    world: ' Le monde a choisi {answer}.',
    none: '{country} : personne n\'y a encore voté.',
    votes: { one: '{n} vote', other: '{n} votes' },
  },
  it: {
    title: '{country}: {question}',
    lead: '{country}: in testa {answer} con il {pct}% di {votes}',
    tie: '{country}: {answers} pari con il {pct}% ciascuno di {votes}',
    then: ', poi ', and: ' e ', more: ' e altre',
    world: ' Il mondo ha scelto {answer}.',
    none: '{country}: nessuno da lì ha ancora votato.',
    votes: { one: '{n} voto', other: '{n} voti' },
  },
  pl: {
    title: '{country}: {question}',
    lead: '{country}: prowadzi {answer} z wynikiem {pct}% spośród {votes}',
    tie: '{country}: {answers} remisują, po {pct}% spośród {votes}',
    then: ', dalej ', and: ' i ', more: ' i inne',
    world: ' Świat wybrał {answer}.',
    none: '{country}: stamtąd nikt jeszcze nie głosował.',
    votes: { one: '{n} głosu', other: '{n} głosów' },
  },
};

function fill(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

function votesLabel(t, lang, n) {
  const cat = new Intl.PluralRules(lang).select(n);
  return fill(cat === 'one' ? t.votes.one : t.votes.other, { n });
}

// "A", "A and B", "A, B and C".
function joinAnd(items, t) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + t.and + items[items.length - 1];
}

const pctOf = (n, total) => (total ? Math.round((n / total) * 100) : 0);

/**
 * @param {string} lang  UI locale ('en', 'cs', ...); unknown falls back to en.
 * @param {string} countryName  The country's name in that locale.
 * @param {{ poll: { name: string, options: { id: string, position: number, text: string }[] },
 *           country: { total: number, leading: { optionId: string, tie: boolean } | null, options: { optionId: string, n: number }[] },
 *           world: { total: number, leading: { optionId: string, tie: boolean } | null } }} item
 * @returns {{ title: string, description: string }}
 */
export function pollCountryMeta(lang, countryName, item) {
  const t = T[lang] || T.en;
  const title = fill(t.title, { country: countryName, question: item.poll.name });
  const total = item.country.total;
  if (!total || !item.country.leading) {
    return { title, description: fill(t.none, { country: countryName }) };
  }

  const here = new Map(item.country.options.map((o) => [o.optionId, o.n]));
  const ranked = item.poll.options
    .map((o) => ({ id: o.id, text: o.text, position: o.position, n: here.get(o.id) ?? 0 }))
    .filter((o) => o.n > 0)
    .sort((a, b) => b.n - a.n || a.position - b.position);
  const top = ranked[0].n;
  const leaders = ranked.filter((o) => o.n === top);
  const rest = ranked.filter((o) => o.n !== top);
  const votes = votesLabel(t, lang, total);

  const head = leaders.length > 1
    ? fill(t.tie, { country: countryName, answers: joinAnd(leaders.map((o) => o.text), t), pct: pctOf(top, total), votes })
    : fill(t.lead, { country: countryName, answer: leaders[0].text, pct: pctOf(top, total), votes });

  const wl = item.world.leading;
  const worldWinner = wl && !wl.tie && leaders.length === 1 && wl.optionId !== leaders[0].id
    ? item.poll.options.find((o) => o.id === wl.optionId)
    : null;
  const world = worldWinner ? fill(t.world, { answer: worldWinner.text }) : '';

  // As many tail answers as fit, biggest first; the rest become "and more".
  const parts = rest.map((o) => `${o.text} ${pctOf(o.n, total)}%`);
  const build = (k) => {
    if (k === 0) return `${head}.${world}`;
    const shown = parts.slice(0, k);
    const tail = k < parts.length ? shown.join(', ') + t.more : joinAnd(shown, t);
    return `${head}${t.then}${tail}.${world}`;
  };
  let description = build(0);
  for (let k = 1; k <= parts.length; k++) {
    const next = build(k);
    if (next.length > MAX_DESCRIPTION) break;
    description = next;
  }
  return { title, description };
}
