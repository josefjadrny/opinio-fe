const API_BASE = 'https://api.opinio.live';
const SITE_BASE = 'https://opinio.live';
const DEFAULT_OG_IMAGE = `${SITE_BASE}/og-image.png`;
const ANON_OG_IMAGE = `${SITE_BASE}/icons/anonymous-mask.png`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_PATH_RE = /^\/p\/([^\/]+)\/?$/;
// Language-PREFIXED profile page, e.g. /fr/p/<uuid>. These are crawler-facing,
// server-rendered translated pages (see handleProfileLang) — the SPA is NOT
// involved for these and stays untouched. English lives on the bare /p/<uuid>
// URL and is the x-default; only the four non-English locales get a prefix.
const PROFILE_LANG_PATH_RE = /^\/(cs|es|de|fr|it|pl)\/p\/([^\/]+)\/?$/;
// Any /<lang>/... path. Profile lang pages are handled separately (standalone
// render); everything else under a prefix is served as the SPA shell with
// translated meta (see handleLangShell).
const LANG_PREFIX_RE = /^\/(cs|es|de|fr|it|pl)(\/.*)?$/;
const USER_PATH_RE = /^\/u\/([^\/]+)\/?$/;
const COUNTRY_PATH_RE = /^\/c\/([^\/]+)\/?$/;
// /news and /n/<id>: the removed news pages, all answered 410.
const NEWS_PATH_RE = /^\/(?:news|n\/[^\/]+)\/?$/;
const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

// Locales that get their own prefixed URL. English is excluded — it stays on
// the bare path and is emitted as hreflang="en" + x-default. Keep in sync with
// the i18n LANGUAGES set and the API sitemap's PREFIX_LANGS.
const PREFIX_LANGS = ['cs', 'es', 'de', 'fr', 'it', 'pl'];

// Per-locale chrome for the standalone translated profile page. Descriptive
// copy uses the natural word for "opinion" per locale (not the invariable
// "opinio" brand token, which is reserved for interactive UI); punctuation is
// plain ASCII hyphens.
const LANG_UI = {
  cs: {
    ogLocale: 'cs_CZ',
    cta: 'Hlasovat na Opinio',
    tagline: 'Zeptej se světa. Uvidíš, jak odpoví každá země.',
    votes: 'hlasů', countries: 'zemí',
    original: 'Originál:',
    gone: 'Tato anketa už není dostupná.',
    home: 'Zpět na Opinio',
  },
  es: {
    ogLocale: 'es_ES',
    cta: 'Vota en Opinio',
    tagline: 'Pregunta al mundo. Mira cómo responde cada país.',
    votes: 'votos', countries: 'países',
    original: 'Original:',
    gone: 'Esta encuesta ya no está disponible.',
    home: 'Volver a Opinio',
  },
  de: {
    ogLocale: 'de_DE',
    cta: 'Auf Opinio abstimmen',
    tagline: 'Frag die Welt. Sieh, wie jedes Land antwortet.',
    votes: 'Stimmen', countries: 'Länder',
    original: 'Original:',
    gone: 'Diese Umfrage ist nicht mehr verfügbar.',
    home: 'Zurück zu Opinio',
  },
  fr: {
    ogLocale: 'fr_FR',
    cta: 'Voter sur Opinio',
    tagline: 'Interrogez le monde. Voyez comment chaque pays répond.',
    votes: 'votes', countries: 'pays',
    original: 'Original:',
    gone: 'Ce sondage n\'est plus disponible.',
    home: 'Retour à Opinio',
  },
  it: {
    ogLocale: 'it_IT',
    cta: 'Vota su Opinio',
    tagline: 'Chiedi al mondo. Guarda come risponde ogni paese.',
    votes: 'voti', countries: 'paesi',
    original: 'Originale:',
    gone: 'Questo sondaggio non è più disponibile.',
    home: 'Torna a Opinio',
  },
  pl: {
    ogLocale: 'pl_PL',
    cta: 'Głosuj na Opinio',
    tagline: 'Zapytaj świat. Zobacz, jak odpowiada każdy kraj.',
    votes: 'głosów', countries: 'krajów',
    original: 'Oryginał:',
    gone: 'Ta ankieta nie jest już dostępna.',
    home: 'Powrót do Opinio',
  },
};

// Localized country-page title/description templates. {country} = the country
// name, put first as a topic label so no language needs a case ending on it.
// The page is about votes FROM that country. Mirror of the seo.country block in
// opinio-fe/src/i18n/strings.ts - keep the two in sync.
const COUNTRY_SEO = {
  en: {
    title: '{country}: how people there vote - Opinio',
    description: '{country}: the polls people there answered on Opinio, what they chose, and how the rest of the world voted.',
  },
  cs: {
    title: '{country}: jak tam lidé hlasují - Opinio',
    description: '{country}: ankety, na které tam lidé odpověděli na Opinio, co zvolili a jak hlasoval zbytek světa.',
  },
  es: {
    title: '{country}: cómo vota la gente allí - Opinio',
    description: '{country}: las encuestas que la gente de allí respondió en Opinio, qué eligió y cómo votó el resto del mundo.',
  },
  de: {
    title: '{country}: wie die Menschen dort abstimmen - Opinio',
    description: '{country}: die Umfragen, die Menschen dort auf Opinio beantwortet haben, was sie gewählt haben und wie der Rest der Welt abgestimmt hat.',
  },
  fr: {
    title: '{country} : comment les gens y votent - Opinio',
    description: '{country} : les sondages auxquels les gens y ont répondu sur Opinio, leurs choix et le vote du reste du monde.',
  },
  it: {
    title: '{country}: come vota la gente lì - Opinio',
    description: '{country}: i sondaggi a cui la gente lì ha risposto su Opinio, cosa ha scelto e come ha votato il resto del mondo.',
  },
  pl: {
    title: '{country}: jak tam głosują ludzie - Opinio',
    description: '{country}: ankiety, na które odpowiedzieli tam ludzie na Opinio, co wybrali i jak głosowała reszta świata.',
  },
};

// Mirrors opinio-fe/src/utils/countries.ts ALL_COUNTRY_NAMES — used to render
// country OG cards server-side without an API round-trip. Keep the two in sync.
const COUNTRY_NAMES = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AR: 'Argentina', AU: 'Australia',
  AT: 'Austria', BD: 'Bangladesh', BE: 'Belgium', BR: 'Brazil', BG: 'Bulgaria',
  CA: 'Canada', CL: 'Chile', CN: 'China', CO: 'Colombia', HR: 'Croatia',
  CU: 'Cuba', CZ: 'Czechia', DK: 'Denmark', EG: 'Egypt', FI: 'Finland',
  FR: 'France', DE: 'Germany', GR: 'Greece', HU: 'Hungary', IN: 'India',
  ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq', IE: 'Ireland', IL: 'Israel',
  IT: 'Italy', JP: 'Japan', KE: 'Kenya', KR: 'South Korea', KP: 'North Korea',
  MX: 'Mexico', MA: 'Morocco', NL: 'Netherlands', NZ: 'New Zealand', NG: 'Nigeria',
  NO: 'Norway', PK: 'Pakistan', PE: 'Peru', PH: 'Philippines', PL: 'Poland',
  PT: 'Portugal', RO: 'Romania', RU: 'Russia', SA: 'Saudi Arabia', RS: 'Serbia',
  SG: 'Singapore', ZA: 'South Africa', ES: 'Spain', SE: 'Sweden', CH: 'Switzerland',
  TW: 'Taiwan', TH: 'Thailand', TR: 'Turkey', UA: 'Ukraine', AE: 'UAE',
  GB: 'United Kingdom', US: 'United States', VE: 'Venezuela', VN: 'Vietnam',
  AM: 'Armenia', AO: 'Angola', AZ: 'Azerbaijan', BA: 'Bosnia and Herzegovina',
  BF: 'Burkina Faso', BJ: 'Benin', BO: 'Bolivia',
  BB: 'Barbados', BS: 'Bahamas', BT: 'Bhutan', BW: 'Botswana', BN: 'Brunei',
  BI: 'Burundi', BZ: 'Belize', BY: 'Belarus', CD: 'DR Congo',
  CF: 'Central African Republic', CG: 'Republic of Congo', CI: "Côte d'Ivoire",
  CM: 'Cameroon', CR: 'Costa Rica', CY: 'Cyprus', DJ: 'Djibouti',
  DO: 'Dominican Republic', EC: 'Ecuador', EE: 'Estonia', EH: 'Western Sahara',
  ER: 'Eritrea', ET: 'Ethiopia', FJ: 'Fiji', FK: 'Falkland Islands',
  GA: 'Gabon', GE: 'Georgia', GH: 'Ghana', GL: 'Greenland',
  GM: 'Gambia', GN: 'Guinea', GQ: 'Equatorial Guinea', GT: 'Guatemala',
  GW: 'Guinea-Bissau', GY: 'Guyana', HN: 'Honduras', HT: 'Haiti',
  IS: 'Iceland', JM: 'Jamaica', JO: 'Jordan', KG: 'Kyrgyzstan',
  KH: 'Cambodia', KW: 'Kuwait', KZ: 'Kazakhstan', LA: 'Laos',
  LB: 'Lebanon', LK: 'Sri Lanka', LR: 'Liberia', LS: 'Lesotho',
  LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', LY: 'Libya',
  MD: 'Moldova', ME: 'Montenegro', MG: 'Madagascar', MK: 'North Macedonia',
  ML: 'Mali', MM: 'Myanmar', MN: 'Mongolia', MR: 'Mauritania', MT: 'Malta', MV: 'Maldives',
  MW: 'Malawi', MY: 'Malaysia', MZ: 'Mozambique', NA: 'Namibia',
  NC: 'New Caledonia', NE: 'Niger', NI: 'Nicaragua', NP: 'Nepal',
  OM: 'Oman', PA: 'Panama', PG: 'Papua New Guinea', PS: 'Palestine',
  PY: 'Paraguay', QA: 'Qatar', RW: 'Rwanda', SB: 'Solomon Islands',
  SD: 'Sudan', SL: 'Sierra Leone', SK: 'Slovakia', SI: 'Slovenia',
  SN: 'Senegal', SO: 'Somalia', SR: 'Suriname', SS: 'South Sudan',
  SV: 'El Salvador', SY: 'Syria', SZ: 'Eswatini', TD: 'Chad',
  TJ: 'Tajikistan', TL: 'Timor-Leste', TG: 'Togo', TM: 'Turkmenistan',
  TT: 'Trinidad and Tobago', TN: 'Tunisia', TZ: 'Tanzania', UG: 'Uganda',
  UY: 'Uruguay', UZ: 'Uzbekistan', VU: 'Vanuatu', YE: 'Yemen',
  ZM: 'Zambia', ZW: 'Zimbabwe',
};

// Translated country names for the 6 non-English languages. English lives in
// COUNTRY_NAMES above (the fallback). MUST stay in sync with
// opinio-fe/src/utils/countryNames.i18n.ts (same code set + values).
const COUNTRY_NAMES_I18N = {
  AF: { cs: 'Afghánistán', es: 'Afganistán', de: 'Afghanistan', fr: 'Afghanistan', it: 'Afghanistan', pl: 'Afganistan' },
  AL: { cs: 'Albánie', es: 'Albania', de: 'Albanien', fr: 'Albanie', it: 'Albania', pl: 'Albania' },
  DZ: { cs: 'Alžírsko', es: 'Argelia', de: 'Algerien', fr: 'Algérie', it: 'Algeria', pl: 'Algieria' },
  AR: { cs: 'Argentina', es: 'Argentina', de: 'Argentinien', fr: 'Argentine', it: 'Argentina', pl: 'Argentyna' },
  AU: { cs: 'Austrálie', es: 'Australia', de: 'Australien', fr: 'Australie', it: 'Australia', pl: 'Australia' },
  AT: { cs: 'Rakousko', es: 'Austria', de: 'Österreich', fr: 'Autriche', it: 'Austria', pl: 'Austria' },
  BD: { cs: 'Bangladéš', es: 'Bangladés', de: 'Bangladesch', fr: 'Bangladesh', it: 'Bangladesh', pl: 'Bangladesz' },
  BE: { cs: 'Belgie', es: 'Bélgica', de: 'Belgien', fr: 'Belgique', it: 'Belgio', pl: 'Belgia' },
  BR: { cs: 'Brazílie', es: 'Brasil', de: 'Brasilien', fr: 'Brésil', it: 'Brasile', pl: 'Brazylia' },
  BG: { cs: 'Bulharsko', es: 'Bulgaria', de: 'Bulgarien', fr: 'Bulgarie', it: 'Bulgaria', pl: 'Bułgaria' },
  CA: { cs: 'Kanada', es: 'Canadá', de: 'Kanada', fr: 'Canada', it: 'Canada', pl: 'Kanada' },
  CL: { cs: 'Chile', es: 'Chile', de: 'Chile', fr: 'Chili', it: 'Cile', pl: 'Chile' },
  CN: { cs: 'Čína', es: 'China', de: 'China', fr: 'Chine', it: 'Cina', pl: 'Chiny' },
  CO: { cs: 'Kolumbie', es: 'Colombia', de: 'Kolumbien', fr: 'Colombie', it: 'Colombia', pl: 'Kolumbia' },
  HR: { cs: 'Chorvatsko', es: 'Croacia', de: 'Kroatien', fr: 'Croatie', it: 'Croazia', pl: 'Chorwacja' },
  CU: { cs: 'Kuba', es: 'Cuba', de: 'Kuba', fr: 'Cuba', it: 'Cuba', pl: 'Kuba' },
  CZ: { cs: 'Česko', es: 'Chequia', de: 'Tschechien', fr: 'Tchéquie', it: 'Cechia', pl: 'Czechy' },
  DK: { cs: 'Dánsko', es: 'Dinamarca', de: 'Dänemark', fr: 'Danemark', it: 'Danimarca', pl: 'Dania' },
  EG: { cs: 'Egypt', es: 'Egipto', de: 'Ägypten', fr: 'Égypte', it: 'Egitto', pl: 'Egipt' },
  FI: { cs: 'Finsko', es: 'Finlandia', de: 'Finnland', fr: 'Finlande', it: 'Finlandia', pl: 'Finlandia' },
  FR: { cs: 'Francie', es: 'Francia', de: 'Frankreich', fr: 'France', it: 'Francia', pl: 'Francja' },
  DE: { cs: 'Německo', es: 'Alemania', de: 'Deutschland', fr: 'Allemagne', it: 'Germania', pl: 'Niemcy' },
  GR: { cs: 'Řecko', es: 'Grecia', de: 'Griechenland', fr: 'Grèce', it: 'Grecia', pl: 'Grecja' },
  HU: { cs: 'Maďarsko', es: 'Hungría', de: 'Ungarn', fr: 'Hongrie', it: 'Ungheria', pl: 'Węgry' },
  IN: { cs: 'Indie', es: 'India', de: 'Indien', fr: 'Inde', it: 'India', pl: 'Indie' },
  ID: { cs: 'Indonésie', es: 'Indonesia', de: 'Indonesien', fr: 'Indonésie', it: 'Indonesia', pl: 'Indonezja' },
  IR: { cs: 'Írán', es: 'Irán', de: 'Iran', fr: 'Iran', it: 'Iran', pl: 'Iran' },
  IQ: { cs: 'Irák', es: 'Irak', de: 'Irak', fr: 'Irak', it: 'Iraq', pl: 'Irak' },
  IE: { cs: 'Irsko', es: 'Irlanda', de: 'Irland', fr: 'Irlande', it: 'Irlanda', pl: 'Irlandia' },
  IL: { cs: 'Izrael', es: 'Israel', de: 'Israel', fr: 'Israël', it: 'Israele', pl: 'Izrael' },
  IT: { cs: 'Itálie', es: 'Italia', de: 'Italien', fr: 'Italie', it: 'Italia', pl: 'Włochy' },
  JP: { cs: 'Japonsko', es: 'Japón', de: 'Japan', fr: 'Japon', it: 'Giappone', pl: 'Japonia' },
  KE: { cs: 'Keňa', es: 'Kenia', de: 'Kenia', fr: 'Kenya', it: 'Kenya', pl: 'Kenia' },
  KR: { cs: 'Jižní Korea', es: 'Corea del Sur', de: 'Südkorea', fr: 'Corée du Sud', it: 'Corea del Sud', pl: 'Korea Południowa' },
  KP: { cs: 'Severní Korea', es: 'Corea del Norte', de: 'Nordkorea', fr: 'Corée du Nord', it: 'Corea del Nord', pl: 'Korea Północna' },
  MX: { cs: 'Mexiko', es: 'México', de: 'Mexiko', fr: 'Mexique', it: 'Messico', pl: 'Meksyk' },
  MA: { cs: 'Maroko', es: 'Marruecos', de: 'Marokko', fr: 'Maroc', it: 'Marocco', pl: 'Maroko' },
  NL: { cs: 'Nizozemsko', es: 'Países Bajos', de: 'Niederlande', fr: 'Pays-Bas', it: 'Paesi Bassi', pl: 'Holandia' },
  NZ: { cs: 'Nový Zéland', es: 'Nueva Zelanda', de: 'Neuseeland', fr: 'Nouvelle-Zélande', it: 'Nuova Zelanda', pl: 'Nowa Zelandia' },
  NG: { cs: 'Nigérie', es: 'Nigeria', de: 'Nigeria', fr: 'Nigéria', it: 'Nigeria', pl: 'Nigeria' },
  NO: { cs: 'Norsko', es: 'Noruega', de: 'Norwegen', fr: 'Norvège', it: 'Norvegia', pl: 'Norwegia' },
  PK: { cs: 'Pákistán', es: 'Pakistán', de: 'Pakistan', fr: 'Pakistan', it: 'Pakistan', pl: 'Pakistan' },
  PE: { cs: 'Peru', es: 'Perú', de: 'Peru', fr: 'Pérou', it: 'Perù', pl: 'Peru' },
  PH: { cs: 'Filipíny', es: 'Filipinas', de: 'Philippinen', fr: 'Philippines', it: 'Filippine', pl: 'Filipiny' },
  PL: { cs: 'Polsko', es: 'Polonia', de: 'Polen', fr: 'Pologne', it: 'Polonia', pl: 'Polska' },
  PT: { cs: 'Portugalsko', es: 'Portugal', de: 'Portugal', fr: 'Portugal', it: 'Portogallo', pl: 'Portugalia' },
  RO: { cs: 'Rumunsko', es: 'Rumanía', de: 'Rumänien', fr: 'Roumanie', it: 'Romania', pl: 'Rumunia' },
  RU: { cs: 'Rusko', es: 'Rusia', de: 'Russland', fr: 'Russie', it: 'Russia', pl: 'Rosja' },
  SA: { cs: 'Saúdská Arábie', es: 'Arabia Saudí', de: 'Saudi-Arabien', fr: 'Arabie saoudite', it: 'Arabia Saudita', pl: 'Arabia Saudyjska' },
  RS: { cs: 'Srbsko', es: 'Serbia', de: 'Serbien', fr: 'Serbie', it: 'Serbia', pl: 'Serbia' },
  SG: { cs: 'Singapur', es: 'Singapur', de: 'Singapur', fr: 'Singapour', it: 'Singapore', pl: 'Singapur' },
  ZA: { cs: 'Jihoafrická republika', es: 'Sudáfrica', de: 'Südafrika', fr: 'Afrique du Sud', it: 'Sudafrica', pl: 'RPA' },
  ES: { cs: 'Španělsko', es: 'España', de: 'Spanien', fr: 'Espagne', it: 'Spagna', pl: 'Hiszpania' },
  SE: { cs: 'Švédsko', es: 'Suecia', de: 'Schweden', fr: 'Suède', it: 'Svezia', pl: 'Szwecja' },
  CH: { cs: 'Švýcarsko', es: 'Suiza', de: 'Schweiz', fr: 'Suisse', it: 'Svizzera', pl: 'Szwajcaria' },
  TW: { cs: 'Tchaj-wan', es: 'Taiwán', de: 'Taiwan', fr: 'Taïwan', it: 'Taiwan', pl: 'Tajwan' },
  TH: { cs: 'Thajsko', es: 'Tailandia', de: 'Thailand', fr: 'Thaïlande', it: 'Thailandia', pl: 'Tajlandia' },
  TR: { cs: 'Turecko', es: 'Turquía', de: 'Türkei', fr: 'Turquie', it: 'Turchia', pl: 'Turcja' },
  UA: { cs: 'Ukrajina', es: 'Ucrania', de: 'Ukraine', fr: 'Ukraine', it: 'Ucraina', pl: 'Ukraina' },
  AE: { cs: 'Spojené arabské emiráty', es: 'Emiratos Árabes Unidos', de: 'Vereinigte Arabische Emirate', fr: 'Émirats arabes unis', it: 'Emirati Arabi Uniti', pl: 'Zjednoczone Emiraty Arabskie' },
  GB: { cs: 'Spojené království', es: 'Reino Unido', de: 'Vereinigtes Königreich', fr: 'Royaume-Uni', it: 'Regno Unito', pl: 'Wielka Brytania' },
  US: { cs: 'Spojené státy', es: 'Estados Unidos', de: 'Vereinigte Staaten', fr: 'États-Unis', it: 'Stati Uniti', pl: 'Stany Zjednoczone' },
  VE: { cs: 'Venezuela', es: 'Venezuela', de: 'Venezuela', fr: 'Venezuela', it: 'Venezuela', pl: 'Wenezuela' },
  VN: { cs: 'Vietnam', es: 'Vietnam', de: 'Vietnam', fr: 'Viêt Nam', it: 'Vietnam', pl: 'Wietnam' },
  AM: { cs: 'Arménie', es: 'Armenia', de: 'Armenien', fr: 'Arménie', it: 'Armenia', pl: 'Armenia' },
  AO: { cs: 'Angola', es: 'Angola', de: 'Angola', fr: 'Angola', it: 'Angola', pl: 'Angola' },
  AZ: { cs: 'Ázerbájdžán', es: 'Azerbaiyán', de: 'Aserbaidschan', fr: 'Azerbaïdjan', it: 'Azerbaigian', pl: 'Azerbejdżan' },
  BA: { cs: 'Bosna a Hercegovina', es: 'Bosnia y Herzegovina', de: 'Bosnien und Herzegowina', fr: 'Bosnie-Herzégovine', it: 'Bosnia ed Erzegovina', pl: 'Bośnia i Hercegowina' },
  BF: { cs: 'Burkina Faso', es: 'Burkina Faso', de: 'Burkina Faso', fr: 'Burkina Faso', it: 'Burkina Faso', pl: 'Burkina Faso' },
  BJ: { cs: 'Benin', es: 'Benín', de: 'Benin', fr: 'Bénin', it: 'Benin', pl: 'Benin' },
  BO: { cs: 'Bolívie', es: 'Bolivia', de: 'Bolivien', fr: 'Bolivie', it: 'Bolivia', pl: 'Boliwia' },
  BB: { cs: 'Barbados', es: 'Barbados', de: 'Barbados', fr: 'Barbade', it: 'Barbados', pl: 'Barbados' },
  BS: { cs: 'Bahamy', es: 'Bahamas', de: 'Bahamas', fr: 'Bahamas', it: 'Bahamas', pl: 'Bahamy' },
  BT: { cs: 'Bhútán', es: 'Bután', de: 'Bhutan', fr: 'Bhoutan', it: 'Bhutan', pl: 'Bhutan' },
  BW: { cs: 'Botswana', es: 'Botsuana', de: 'Botswana', fr: 'Botswana', it: 'Botswana', pl: 'Botswana' },
  BN: { cs: 'Brunej', es: 'Brunéi', de: 'Brunei', fr: 'Brunei', it: 'Brunei', pl: 'Brunei' },
  BI: { cs: 'Burundi', es: 'Burundi', de: 'Burundi', fr: 'Burundi', it: 'Burundi', pl: 'Burundi' },
  BZ: { cs: 'Belize', es: 'Belice', de: 'Belize', fr: 'Belize', it: 'Belize', pl: 'Belize' },
  BY: { cs: 'Bělorusko', es: 'Bielorrusia', de: 'Belarus', fr: 'Biélorussie', it: 'Bielorussia', pl: 'Białoruś' },
  CD: { cs: 'DR Kongo', es: 'RD del Congo', de: 'DR Kongo', fr: 'RD Congo', it: 'RD del Congo', pl: 'DR Konga' },
  CF: { cs: 'Středoafrická republika', es: 'República Centroafricana', de: 'Zentralafrikanische Republik', fr: 'République centrafricaine', it: 'Rep. Centrafricana', pl: 'Republika Środkowoafrykańska' },
  CG: { cs: 'Republika Kongo', es: 'República del Congo', de: 'Republik Kongo', fr: 'République du Congo', it: 'Repubblica del Congo', pl: 'Republika Konga' },
  CI: { cs: 'Pobřeží slonoviny', es: 'Costa de Marfil', de: 'Elfenbeinküste', fr: "Côte d'Ivoire", it: "Costa d'Avorio", pl: 'Wybrzeże Kości Słoniowej' },
  CM: { cs: 'Kamerun', es: 'Camerún', de: 'Kamerun', fr: 'Cameroun', it: 'Camerun', pl: 'Kamerun' },
  CR: { cs: 'Kostarika', es: 'Costa Rica', de: 'Costa Rica', fr: 'Costa Rica', it: 'Costa Rica', pl: 'Kostaryka' },
  CY: { cs: 'Kypr', es: 'Chipre', de: 'Zypern', fr: 'Chypre', it: 'Cipro', pl: 'Cypr' },
  DJ: { cs: 'Džibutsko', es: 'Yibuti', de: 'Dschibuti', fr: 'Djibouti', it: 'Gibuti', pl: 'Dżibuti' },
  DO: { cs: 'Dominikánská republika', es: 'República Dominicana', de: 'Dominikanische Republik', fr: 'République dominicaine', it: 'Rep. Dominicana', pl: 'Dominikana' },
  EC: { cs: 'Ekvádor', es: 'Ecuador', de: 'Ecuador', fr: 'Équateur', it: 'Ecuador', pl: 'Ekwador' },
  EE: { cs: 'Estonsko', es: 'Estonia', de: 'Estland', fr: 'Estonie', it: 'Estonia', pl: 'Estonia' },
  EH: { cs: 'Západní Sahara', es: 'Sáhara Occidental', de: 'Westsahara', fr: 'Sahara occidental', it: 'Sahara Occidentale', pl: 'Sahara Zachodnia' },
  ER: { cs: 'Eritrea', es: 'Eritrea', de: 'Eritrea', fr: 'Érythrée', it: 'Eritrea', pl: 'Erytrea' },
  ET: { cs: 'Etiopie', es: 'Etiopía', de: 'Äthiopien', fr: 'Éthiopie', it: 'Etiopia', pl: 'Etiopia' },
  FJ: { cs: 'Fidži', es: 'Fiyi', de: 'Fidschi', fr: 'Fidji', it: 'Figi', pl: 'Fidżi' },
  FK: { cs: 'Falklandy', es: 'Islas Malvinas', de: 'Falklandinseln', fr: 'Îles Malouines', it: 'Isole Falkland', pl: 'Falklandy' },
  GA: { cs: 'Gabon', es: 'Gabón', de: 'Gabun', fr: 'Gabon', it: 'Gabon', pl: 'Gabon' },
  GE: { cs: 'Gruzie', es: 'Georgia', de: 'Georgien', fr: 'Géorgie', it: 'Georgia', pl: 'Gruzja' },
  GH: { cs: 'Ghana', es: 'Ghana', de: 'Ghana', fr: 'Ghana', it: 'Ghana', pl: 'Ghana' },
  GL: { cs: 'Grónsko', es: 'Groenlandia', de: 'Grönland', fr: 'Groenland', it: 'Groenlandia', pl: 'Grenlandia' },
  GM: { cs: 'Gambie', es: 'Gambia', de: 'Gambia', fr: 'Gambie', it: 'Gambia', pl: 'Gambia' },
  GN: { cs: 'Guinea', es: 'Guinea', de: 'Guinea', fr: 'Guinée', it: 'Guinea', pl: 'Gwinea' },
  GQ: { cs: 'Rovníková Guinea', es: 'Guinea Ecuatorial', de: 'Äquatorialguinea', fr: 'Guinée équatoriale', it: 'Guinea Equatoriale', pl: 'Gwinea Równikowa' },
  GT: { cs: 'Guatemala', es: 'Guatemala', de: 'Guatemala', fr: 'Guatemala', it: 'Guatemala', pl: 'Gwatemala' },
  GW: { cs: 'Guinea-Bissau', es: 'Guinea-Bisáu', de: 'Guinea-Bissau', fr: 'Guinée-Bissau', it: 'Guinea-Bissau', pl: 'Gwinea Bissau' },
  GY: { cs: 'Guyana', es: 'Guyana', de: 'Guyana', fr: 'Guyana', it: 'Guyana', pl: 'Gujana' },
  HN: { cs: 'Honduras', es: 'Honduras', de: 'Honduras', fr: 'Honduras', it: 'Honduras', pl: 'Honduras' },
  HT: { cs: 'Haiti', es: 'Haití', de: 'Haiti', fr: 'Haïti', it: 'Haiti', pl: 'Haiti' },
  IS: { cs: 'Island', es: 'Islandia', de: 'Island', fr: 'Islande', it: 'Islanda', pl: 'Islandia' },
  JM: { cs: 'Jamajka', es: 'Jamaica', de: 'Jamaika', fr: 'Jamaïque', it: 'Giamaica', pl: 'Jamajka' },
  JO: { cs: 'Jordánsko', es: 'Jordania', de: 'Jordanien', fr: 'Jordanie', it: 'Giordania', pl: 'Jordania' },
  KG: { cs: 'Kyrgyzstán', es: 'Kirguistán', de: 'Kirgisistan', fr: 'Kirghizistan', it: 'Kirghizistan', pl: 'Kirgistan' },
  KH: { cs: 'Kambodža', es: 'Camboya', de: 'Kambodscha', fr: 'Cambodge', it: 'Cambogia', pl: 'Kambodża' },
  KW: { cs: 'Kuvajt', es: 'Kuwait', de: 'Kuwait', fr: 'Koweït', it: 'Kuwait', pl: 'Kuwejt' },
  KZ: { cs: 'Kazachstán', es: 'Kazajistán', de: 'Kasachstan', fr: 'Kazakhstan', it: 'Kazakistan', pl: 'Kazachstan' },
  LA: { cs: 'Laos', es: 'Laos', de: 'Laos', fr: 'Laos', it: 'Laos', pl: 'Laos' },
  LB: { cs: 'Libanon', es: 'Líbano', de: 'Libanon', fr: 'Liban', it: 'Libano', pl: 'Liban' },
  LK: { cs: 'Srí Lanka', es: 'Sri Lanka', de: 'Sri Lanka', fr: 'Sri Lanka', it: 'Sri Lanka', pl: 'Sri Lanka' },
  LR: { cs: 'Libérie', es: 'Liberia', de: 'Liberia', fr: 'Liberia', it: 'Liberia', pl: 'Liberia' },
  LS: { cs: 'Lesotho', es: 'Lesoto', de: 'Lesotho', fr: 'Lesotho', it: 'Lesotho', pl: 'Lesotho' },
  LT: { cs: 'Litva', es: 'Lituania', de: 'Litauen', fr: 'Lituanie', it: 'Lituania', pl: 'Litwa' },
  LU: { cs: 'Lucembursko', es: 'Luxemburgo', de: 'Luxemburg', fr: 'Luxembourg', it: 'Lussemburgo', pl: 'Luksemburg' },
  LV: { cs: 'Lotyšsko', es: 'Letonia', de: 'Lettland', fr: 'Lettonie', it: 'Lettonia', pl: 'Łotwa' },
  LY: { cs: 'Libye', es: 'Libia', de: 'Libyen', fr: 'Libye', it: 'Libia', pl: 'Libia' },
  MD: { cs: 'Moldavsko', es: 'Moldavia', de: 'Moldau', fr: 'Moldavie', it: 'Moldavia', pl: 'Mołdawia' },
  ME: { cs: 'Černá Hora', es: 'Montenegro', de: 'Montenegro', fr: 'Monténégro', it: 'Montenegro', pl: 'Czarnogóra' },
  MG: { cs: 'Madagaskar', es: 'Madagascar', de: 'Madagaskar', fr: 'Madagascar', it: 'Madagascar', pl: 'Madagaskar' },
  MK: { cs: 'Severní Makedonie', es: 'Macedonia del Norte', de: 'Nordmazedonien', fr: 'Macédoine du Nord', it: 'Macedonia del Nord', pl: 'Macedonia Północna' },
  ML: { cs: 'Mali', es: 'Malí', de: 'Mali', fr: 'Mali', it: 'Mali', pl: 'Mali' },
  MM: { cs: 'Myanmar', es: 'Myanmar', de: 'Myanmar', fr: 'Birmanie', it: 'Myanmar', pl: 'Mjanma' },
  MN: { cs: 'Mongolsko', es: 'Mongolia', de: 'Mongolei', fr: 'Mongolie', it: 'Mongolia', pl: 'Mongolia' },
  MR: { cs: 'Mauritánie', es: 'Mauritania', de: 'Mauretanien', fr: 'Mauritanie', it: 'Mauritania', pl: 'Mauretania' },
  MT: { cs: 'Malta', es: 'Malta', de: 'Malta', fr: 'Malte', it: 'Malta', pl: 'Malta' },
  MV: { cs: 'Maledivy', es: 'Maldivas', de: 'Malediven', fr: 'Maldives', it: 'Maldive', pl: 'Malediwy' },
  MW: { cs: 'Malawi', es: 'Malaui', de: 'Malawi', fr: 'Malawi', it: 'Malawi', pl: 'Malawi' },
  MY: { cs: 'Malajsie', es: 'Malasia', de: 'Malaysia', fr: 'Malaisie', it: 'Malaysia', pl: 'Malezja' },
  MZ: { cs: 'Mosambik', es: 'Mozambique', de: 'Mosambik', fr: 'Mozambique', it: 'Mozambico', pl: 'Mozambik' },
  NA: { cs: 'Namibie', es: 'Namibia', de: 'Namibia', fr: 'Namibie', it: 'Namibia', pl: 'Namibia' },
  NC: { cs: 'Nová Kaledonie', es: 'Nueva Caledonia', de: 'Neukaledonien', fr: 'Nouvelle-Calédonie', it: 'Nuova Caledonia', pl: 'Nowa Kaledonia' },
  NE: { cs: 'Niger', es: 'Níger', de: 'Niger', fr: 'Niger', it: 'Niger', pl: 'Niger' },
  NI: { cs: 'Nikaragua', es: 'Nicaragua', de: 'Nicaragua', fr: 'Nicaragua', it: 'Nicaragua', pl: 'Nikaragua' },
  NP: { cs: 'Nepál', es: 'Nepal', de: 'Nepal', fr: 'Népal', it: 'Nepal', pl: 'Nepal' },
  OM: { cs: 'Omán', es: 'Omán', de: 'Oman', fr: 'Oman', it: 'Oman', pl: 'Oman' },
  PA: { cs: 'Panama', es: 'Panamá', de: 'Panama', fr: 'Panama', it: 'Panama', pl: 'Panama' },
  PG: { cs: 'Papua-Nová Guinea', es: 'Papúa Nueva Guinea', de: 'Papua-Neuguinea', fr: 'Papouasie-Nouvelle-Guinée', it: 'Papua Nuova Guinea', pl: 'Papua-Nowa Gwinea' },
  PS: { cs: 'Palestina', es: 'Palestina', de: 'Palästina', fr: 'Palestine', it: 'Palestina', pl: 'Palestyna' },
  PY: { cs: 'Paraguay', es: 'Paraguay', de: 'Paraguay', fr: 'Paraguay', it: 'Paraguay', pl: 'Paragwaj' },
  QA: { cs: 'Katar', es: 'Catar', de: 'Katar', fr: 'Qatar', it: 'Qatar', pl: 'Katar' },
  RW: { cs: 'Rwanda', es: 'Ruanda', de: 'Ruanda', fr: 'Rwanda', it: 'Ruanda', pl: 'Rwanda' },
  SB: { cs: 'Šalomounovy ostrovy', es: 'Islas Salomón', de: 'Salomonen', fr: 'Îles Salomon', it: 'Isole Salomone', pl: 'Wyspy Salomona' },
  SD: { cs: 'Súdán', es: 'Sudán', de: 'Sudan', fr: 'Soudan', it: 'Sudan', pl: 'Sudan' },
  SL: { cs: 'Sierra Leone', es: 'Sierra Leona', de: 'Sierra Leone', fr: 'Sierra Leone', it: 'Sierra Leone', pl: 'Sierra Leone' },
  SK: { cs: 'Slovensko', es: 'Eslovaquia', de: 'Slowakei', fr: 'Slovaquie', it: 'Slovacchia', pl: 'Słowacja' },
  SI: { cs: 'Slovinsko', es: 'Eslovenia', de: 'Slowenien', fr: 'Slovénie', it: 'Slovenia', pl: 'Słowenia' },
  SN: { cs: 'Senegal', es: 'Senegal', de: 'Senegal', fr: 'Sénégal', it: 'Senegal', pl: 'Senegal' },
  SO: { cs: 'Somálsko', es: 'Somalia', de: 'Somalia', fr: 'Somalie', it: 'Somalia', pl: 'Somalia' },
  SR: { cs: 'Surinam', es: 'Surinam', de: 'Suriname', fr: 'Suriname', it: 'Suriname', pl: 'Surinam' },
  SS: { cs: 'Jižní Súdán', es: 'Sudán del Sur', de: 'Südsudan', fr: 'Soudan du Sud', it: 'Sudan del Sud', pl: 'Sudan Południowy' },
  SV: { cs: 'Salvador', es: 'El Salvador', de: 'El Salvador', fr: 'Salvador', it: 'El Salvador', pl: 'Salwador' },
  SY: { cs: 'Sýrie', es: 'Siria', de: 'Syrien', fr: 'Syrie', it: 'Siria', pl: 'Syria' },
  SZ: { cs: 'Eswatini', es: 'Esuatini', de: 'Eswatini', fr: 'Eswatini', it: 'Eswatini', pl: 'Eswatini' },
  TD: { cs: 'Čad', es: 'Chad', de: 'Tschad', fr: 'Tchad', it: 'Ciad', pl: 'Czad' },
  TJ: { cs: 'Tádžikistán', es: 'Tayikistán', de: 'Tadschikistan', fr: 'Tadjikistan', it: 'Tagikistan', pl: 'Tadżykistan' },
  TL: { cs: 'Východní Timor', es: 'Timor Oriental', de: 'Osttimor', fr: 'Timor oriental', it: 'Timor Est', pl: 'Timor Wschodni' },
  TG: { cs: 'Togo', es: 'Togo', de: 'Togo', fr: 'Togo', it: 'Togo', pl: 'Togo' },
  TM: { cs: 'Turkmenistán', es: 'Turkmenistán', de: 'Turkmenistan', fr: 'Turkménistan', it: 'Turkmenistan', pl: 'Turkmenistan' },
  TT: { cs: 'Trinidad a Tobago', es: 'Trinidad y Tobago', de: 'Trinidad und Tobago', fr: 'Trinité-et-Tobago', it: 'Trinidad e Tobago', pl: 'Trynidad i Tobago' },
  TN: { cs: 'Tunisko', es: 'Túnez', de: 'Tunesien', fr: 'Tunisie', it: 'Tunisia', pl: 'Tunezja' },
  TZ: { cs: 'Tanzanie', es: 'Tanzania', de: 'Tansania', fr: 'Tanzanie', it: 'Tanzania', pl: 'Tanzania' },
  UG: { cs: 'Uganda', es: 'Uganda', de: 'Uganda', fr: 'Ouganda', it: 'Uganda', pl: 'Uganda' },
  UY: { cs: 'Uruguay', es: 'Uruguay', de: 'Uruguay', fr: 'Uruguay', it: 'Uruguay', pl: 'Urugwaj' },
  UZ: { cs: 'Uzbekistán', es: 'Uzbekistán', de: 'Usbekistan', fr: 'Ouzbékistan', it: 'Uzbekistan', pl: 'Uzbekistan' },
  VU: { cs: 'Vanuatu', es: 'Vanuatu', de: 'Vanuatu', fr: 'Vanuatu', it: 'Vanuatu', pl: 'Vanuatu' },
  YE: { cs: 'Jemen', es: 'Yemen', de: 'Jemen', fr: 'Yémen', it: 'Yemen', pl: 'Jemen' },
  ZM: { cs: 'Zambie', es: 'Zambia', de: 'Sambia', fr: 'Zambie', it: 'Zambia', pl: 'Zambia' },
  ZW: { cs: 'Zimbabwe', es: 'Zimbabue', de: 'Simbabwe', fr: 'Zimbabwe', it: 'Zimbabwe', pl: 'Zimbabwe' },
};

// Country name in `lang`, falling back to English (COUNTRY_NAMES). Returns
// undefined for an unknown code (used as the country-page not-found gate).
function countryName(code, lang) {
  const up = (code || '').toUpperCase();
  if (lang && lang !== 'en') {
    const translated = (COUNTRY_NAMES_I18N[up] || {})[lang];
    if (translated) return translated;
  }
  return COUNTRY_NAMES[up];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(value, max) {
  const s = String(value ?? '').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

const GOOGLE_AVATAR_SIZE = 256;

// Google profile photos come back from OAuth as `=s96-c` (96×96), which
// social crawlers reject as too small for a card preview. Bump them to a
// mid-size square that's high enough for WhatsApp/Twitter to accept but
// small enough that they render as a compact inline thumbnail rather than
// a full-width hero image (≥300px tends to trip the big-preview heuristic).
function upscaleAvatarUrl(url) {
  if (!url) return url;
  if (/lh\d+\.googleusercontent\.com/.test(url)) {
    if (/=s\d+-c/.test(url)) return url.replace(/=s\d+-c/, `=s${GOOGLE_AVATAR_SIZE}-c`);
    if (!/[?=]/.test(url)) return `${url}=s${GOOGLE_AVATAR_SIZE}-c`;
  }
  return url;
}

// Returns a discriminated result so callers can distinguish a genuine
// "entity does not exist" (upstream 404 → SEO 404) from a transient API
// outage (5xx / network / timeout → keep serving the 200 shell). A naive
// "null means not-found" would turn an API blip into 404s for live content
// and tell crawlers to drop real profiles.
//   { ok: true,  data }                  — upstream 200
//   { ok: false, notFound: true }        — upstream 404 (genuinely gone)
//   { ok: false, notFound: false }       — 5xx / other non-200 / network / timeout
async function fetchProfile(id, lang) {
  try {
    // ?lang= makes the API COALESCE to the translated columns (falls back to the
    // original when a translation is missing, so this is never an error path).
    const qs = lang ? `?lang=${lang}` : '';
    const res = await fetch(`${API_BASE}/api/profiles/${id}${qs}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (res.ok) return { ok: true, data: await res.json() };
    return { ok: false, notFound: res.status === 404 };
  } catch {
    return { ok: false, notFound: false };
  }
}

async function fetchUser(id) {
  try {
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (res.ok) return { ok: true, data: await res.json() };
    return { ok: false, notFound: res.status === 404 };
  } catch {
    return { ok: false, notFound: false };
  }
}

async function handleSitemap() {
  // Proxy the API-built sitemap so opinio.live/sitemap.xml stays on the canonical
  // host (Google ignores cross-host sitemaps unless both hosts are verified).
  // 10-min edge cache mirrors the in-process cache on the API side. We let CF
  // honour the upstream Cache-Control (only set on 200s) instead of forcing
  // cacheEverything — otherwise a transient API failure caches the bad response
  // and locks the worker out for the full TTL.
  try {
    const res = await fetch(`${API_BASE}/sitemap.xml`, {
      cf: { cacheTtl: 600 },
    });
    if (!res.ok) return new Response('sitemap unavailable', { status: 502 });
    const headers = new Headers();
    headers.set('content-type', 'application/xml; charset=utf-8');
    headers.set('cache-control', 'public, max-age=600, s-maxage=600');
    headers.set('x-opinio-og', 'sitemap');
    return new Response(res.body, { status: 200, headers });
  } catch {
    return new Response('sitemap unavailable', { status: 502 });
  }
}

// The index gate: a /p/, /c/ or /u/ page is indexable only while the sitemap
// lists its bare path (and then so are its /<lang>/ versions). Google finds
// every page through feed links and hreflang regardless of the sitemap, so
// without this it indexed ~25x what we advertise - empty countries, users with
// no opinios, months-old low-vote opinios. The sitemap's own rules decide.
// Read once per isolate per 10 min (single-flight); null when the sitemap
// cannot be read, which keeps pages indexable - an API blip must never
// noindex the whole site.
const ADVERTISED_TTL_MS = 10 * 60_000;
let advertised = { at: 0, paths: null, pending: null };

async function fetchAdvertisedPaths() {
  if (advertised.paths && Date.now() - advertised.at < ADVERTISED_TTL_MS) return advertised.paths;
  if (advertised.pending) return advertised.pending;
  advertised.pending = (async () => {
    try {
      const res = await fetch(`${API_BASE}/sitemap.xml`, { cf: { cacheTtl: 600 } });
      if (!res.ok) return advertised.paths;
      const xml = await res.text();
      const paths = new Set();
      for (const m of xml.matchAll(/<loc>https:\/\/opinio\.live([^<]*)<\/loc>/g)) paths.add(m[1]);
      advertised = { at: Date.now(), paths, pending: null };
      return paths;
    } catch {
      return advertised.paths;
    } finally {
      advertised.pending = null;
    }
  })();
  return advertised.pending;
}

// true = send noindex for this bare path.
function isUnadvertised(paths, basePath) {
  return !!paths && !paths.has(basePath);
}

const NOINDEX = 'noindex, follow';

async function fetchShellHtml(request) {
  const url = new URL(request.url);
  url.pathname = '/index.html';
  url.search = '';
  const res = await fetch(url.toString(), {
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  return res;
}

function replaceMetaContent(html, attrPattern, value) {
  const re = new RegExp(`(<meta\\s+${attrPattern}\\s+content=")[^"]*(")`, 'i');
  return html.replace(re, `$1${value}$2`);
}

function removeMetaTag(html, attrPattern) {
  const re = new RegExp(`\\s*<meta\\s+${attrPattern}[^>]*>`, 'i');
  return html.replace(re, '');
}

// Pick a reasonable square size + content-type for avatar-style images, so we
// can emit accurate og:image:width / og:image:height / og:image:type instead of
// leaving them off. WhatsApp in particular skips the preview image entirely
// when the dimensions are missing or contradicted by the URL.
function avatarDims(imageUrl) {
  if (!imageUrl) return null;
  // Google avatar URLs are upscaled to =sN-c JPEG by upscaleAvatarUrl()
  if (/lh\d+\.googleusercontent\.com/.test(imageUrl)) {
    return { width: GOOGLE_AVATAR_SIZE, height: GOOGLE_AVATAR_SIZE, type: 'image/jpeg' };
  }
  // Uploaded avatars are 128x128 JPEGs (canvas resize on the FE)
  if (/images\.opinio\.live\//.test(imageUrl) || /opinio-images(?:-dev)?\.s3\./.test(imageUrl)) {
    return { width: 128, height: 128, type: 'image/jpeg' };
  }
  // Anonymous-mask fallback (100x100 PNG)
  if (imageUrl.endsWith('/icons/anonymous-mask.png')) {
    return { width: 100, height: 100, type: 'image/png' };
  }
  return null;
}

// Build the rel=alternate hreflang set for a base path (the English/bare URL,
// e.g. "/p/<id>"). English + x-default point at the bare URL; each non-English
// locale points at its PREFIXED URL ("/<lang>/p/<id>"). Used on both the bare
// page (so it declares its translations) and every prefixed page (so the return
// links reciprocate).
function hreflangLinks(basePath) {
  const lines = [`<link rel="alternate" hreflang="en" href="${SITE_BASE}${basePath}" />`];
  for (const lang of PREFIX_LANGS) {
    lines.push(`<link rel="alternate" hreflang="${lang}" href="${SITE_BASE}/${lang}${basePath}" />`);
  }
  lines.push(`<link rel="alternate" hreflang="x-default" href="${SITE_BASE}${basePath}" />`);
  return lines.join('\n    ');
}

function injectProfileMeta(html, meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const image = escapeHtml(meta.image);
  const imageAlt = escapeHtml(meta.imageAlt);
  const url = escapeHtml(meta.url);

  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  out = replaceMetaContent(out, 'name="description"', description);
  out = replaceMetaContent(out, 'property="og:title"', title);
  out = replaceMetaContent(out, 'property="og:description"', description);
  out = replaceMetaContent(out, 'property="og:url"', url);
  out = replaceMetaContent(out, 'property="og:image"', image);
  out = replaceMetaContent(out, 'property="og:image:alt"', imageAlt);
  out = replaceMetaContent(out, 'name="twitter:title"', title);
  out = replaceMetaContent(out, 'name="twitter:description"', description);
  out = replaceMetaContent(out, 'name="twitter:image"', image);
  out = replaceMetaContent(out, 'name="twitter:image:alt"', imageAlt);

  // For avatar-style square images (Google, uploaded, anonymous mask) override
  // the default 1200x630/PNG hints with the actual dimensions, and switch the
  // Twitter card to the small "summary" layout. Default is left untouched
  // when we can't recognise the source so the shell defaults still win.
  if (meta.isAvatar) {
    const dims = avatarDims(meta.image);
    if (dims) {
      out = replaceMetaContent(out, 'property="og:image:type"', dims.type);
      out = replaceMetaContent(out, 'property="og:image:width"', String(dims.width));
      out = replaceMetaContent(out, 'property="og:image:height"', String(dims.height));
    } else {
      out = removeMetaTag(out, 'property="og:image:type"');
      out = removeMetaTag(out, 'property="og:image:width"');
      out = removeMetaTag(out, 'property="og:image:height"');
    }
    out = replaceMetaContent(out, 'name="twitter:card"', 'summary');
  }

  out = out.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
    `$1${url}$2`
  );

  // On a prefixed (non-English) page, switch og:locale to the page's locale so
  // social crawlers (which don't run JS) preview it in the right language. Left
  // untouched (shell default en_US) for bare English pages.
  if (meta.ogLocale) {
    out = replaceMetaContent(out, 'property="og:locale"', meta.ogLocale);
  }

  // A noindex page gets no alternates: every language version of it is
  // noindex too, and hreflang between pages that are not indexed means nothing.
  if (meta.noindex) {
    return replaceMetaContent(out, 'name="robots"', NOINDEX);
  }

  // When a base path is supplied, declare the language alternates right after
  // the canonical so crawlers can discover the translated URLs and tie them to
  // this page (reciprocal hreflang).
  if (meta.alternatesBase) {
    out = out.replace(
      /(<link\s+rel="canonical"[^>]*>)/i,
      `$1\n    ${hreflangLinks(meta.alternatesBase)}`
    );
  }
  return out;
}

// A poll's answers as one line for meta tags: "Gouda 18%, Brie 19%, ...".
// Results come with GET /api/profiles/:id; a poll without votes lists its
// answers alone.
function pollAnswersLine(profile) {
  const opts = Array.isArray(profile.options) ? profile.options : [];
  const total = profile.results?.total ?? 0;
  return opts.map((o) => {
    if (!total) return o.text;
    const n = profile.results.options.find((r) => r.optionId === o.id)?.n ?? 0;
    return `${o.text} ${Math.round((n / total) * 100)}%`;
  }).join(', ');
}

async function handleProfile(request, id) {
  const [result, shellRes, paths] = await Promise.all([
    fetchProfile(id),
    fetchShellHtml(request),
    fetchAdvertisedPaths(),
  ]);

  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');

  if (!result.ok) {
    // Upstream 404 → the opinio expired or was deleted, and never comes back →
    // 410 Gone, which Google drops faster than a 404 and stops recrawling
    // (still serve the friendly shell so the SPA renders its not-found UI).
    // Any other failure (5xx / network / timeout) is a transient API outage
    // and must keep returning the 200 shell so crawlers don't drop live profiles.
    headers.set('x-opinio-og', result.notFound ? 'notfound' : 'fallback');
    return new Response(shellText, { status: result.notFound ? 410 : 200, headers });
  }

  const profile = result.data;
  headers.set('x-opinio-og', 'profile');

  const title = `${profile.name} - Opinio`;
  const total = profile.results?.total ?? 0;
  const countries = profile.results?.countries ?? 0;
  const descSource = `${pollAnswersLine(profile)}${total ? ` - ${total} vote${total === 1 ? '' : 's'} from ${countries} ${countries === 1 ? 'country' : 'countries'}` : ''}. ${profile.description || ''}`.trim();
  const description = truncate(descSource, 200);
  const hasAvatar = !!profile.imageUrl;
  const image = hasAvatar ? upscaleAvatarUrl(profile.imageUrl) : DEFAULT_OG_IMAGE;
  const imageAlt = hasAvatar ? profile.name : 'Opinio live global social voting';
  const canonicalUrl = `${SITE_BASE}/p/${id}`;
  const noindex = isUnadvertised(paths, `/p/${id}`);
  if (noindex) headers.set('x-robots-tag', NOINDEX);

  const html = injectProfileMeta(shellText, {
    title,
    description,
    image,
    imageAlt,
    url: canonicalUrl,
    isAvatar: hasAvatar,
    alternatesBase: `/p/${id}`,
    noindex,
  });

  return new Response(html, { status: 200, headers });
}

// Same icon set as index.html's head - keep the two in sync.
const FAVICON_LINKS =
  '<link rel="icon" href="/favicon.ico" sizes="48x48" />\n    ' +
  '<link rel="icon" type="image/png" href="/favicon.png" sizes="192x192" />\n    ' +
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />';

// Shared <head> for the standalone language pages: translated meta, a
// self-referencing canonical (the suffixed URL — NEVER the bare one, or Google
// would fold the page into English), and the reciprocal hreflang set.
function langPageHead({ lang, title, description, image, canonical, basePath, noindex }) {
  const ui = LANG_UI[lang];
  return [
    `<title>${escapeHtml(title)}</title>`,
    FAVICON_LINKS,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    noindex ? `<meta name="robots" content="${NOINDEX}" />` : null,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    noindex ? null : `    ${hreflangLinks(basePath)}`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Opinio" />`,
    `<meta property="og:locale" content="${ui.ogLocale}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].filter(Boolean).join('\n    ');
}

const LANG_PAGE_CSS =
  ':root{color-scheme:dark}*{box-sizing:border-box}' +
  'body{margin:0;background:#1a1a2e;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
  'line-height:1.5;-webkit-font-smoothing:antialiased}' +
  '.wrap{max-width:680px;margin:0 auto;padding:24px 20px 64px}' +
  'header a{color:#fff;text-decoration:none;font-weight:700;font-size:20px;letter-spacing:-.01em}' +
  'header a span{color:#e94560}' +
  '.card{margin-top:24px;background:#16213e;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden}' +
  '.hero{width:100%;display:block;aspect-ratio:16/9;object-fit:cover;background:#0f1830}' +
  '.body{padding:20px 22px}' +
  '.meta{display:flex;gap:8px;align-items:center;font-size:13px;color:rgba(255,255,255,.6);margin-bottom:10px}' +
  '.pill{background:rgba(255,255,255,.08);border-radius:999px;padding:2px 10px;font-size:12px}' +
  'h1{font-size:24px;line-height:1.25;margin:0 0 12px}' +
  '.desc{color:rgba(255,255,255,.82);font-size:16px;margin:0 0 16px;white-space:pre-wrap}' +
  '.orig{color:rgba(255,255,255,.4);font-size:13px;margin:0 0 16px}' +
  '.counts{display:flex;gap:18px;font-size:15px;margin:0 0 20px}' +
  '.answers{list-style:none;margin:0 0 14px;padding:0}' +
  '.answers li{display:flex;justify-content:space-between;padding:9px 12px;margin:0 0 6px;border:1px solid rgba(255,255,255,.12);border-radius:12px}' +
  '.counts{color:rgba(255,255,255,.6)}' +
  '.cta{display:inline-block;background:#e94560;color:#fff;text-decoration:none;font-weight:600;' +
  'padding:12px 22px;border-radius:999px;font-size:15px}' +
  '.tag{margin-top:28px;color:rgba(255,255,255,.45);font-size:13px;text-align:center}';

function renderLangPage({ id, lang, profile, noindex }) {
  const ui = LANG_UI[lang];
  const appUrl = `${SITE_BASE}/p/${id}`;
  const canonical = `${SITE_BASE}/${lang}/p/${id}`;
  const name = profile.name || '';
  const description = profile.description || '';
  const translated = profile.originalName && profile.originalName !== name;
  const image = profile.contentImageUrl
    || (profile.imageUrl ? upscaleAvatarUrl(profile.imageUrl) : DEFAULT_OG_IMAGE);
  const title = `${name} - Opinio`;
  const total = profile.results?.total ?? 0;
  const metaDesc = truncate(`${pollAnswersLine(profile)}${total ? ` - ${total} ${ui.votes}` : ''}. ${description}`.trim(), 200);

  const hero = profile.contentImageUrl
    ? `<img class="hero" src="${escapeHtml(profile.contentImageUrl)}" alt="${escapeHtml(name)}" />`
    : '';
  const metaLine = [
    profile.role ? `<span class="pill">${escapeHtml(profile.role)}</span>` : '',
  ].filter(Boolean).join('');
  const origLine = translated
    ? `<p class="orig">${escapeHtml(ui.original)} ${escapeHtml(profile.originalName)}</p>`
    : '';

  return '<!DOCTYPE html>\n' +
    `<html lang="${lang}">\n<head>\n    <meta charset="utf-8" />\n` +
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    ' +
    langPageHead({ lang, title, description: metaDesc, image, canonical, basePath: `/p/${id}`, noindex }) +
    `\n    <style>${LANG_PAGE_CSS}</style>\n</head>\n<body>\n` +
    `  <div class="wrap">\n` +
    `    <header><a href="${SITE_BASE}/">Opin<span>io</span></a></header>\n` +
    `    <article class="card">\n      ${hero}\n      <div class="body">\n` +
    (metaLine ? `        <div class="meta">${metaLine}</div>\n` : '') +
    `        <h1>${escapeHtml(name)}</h1>\n` +
    (description ? `        <p class="desc">${escapeHtml(description)}</p>\n` : '') +
    origLine + '\n' +
    `        <ul class="answers">${(profile.options || []).map((o) => {
      const n = profile.results?.options.find((r) => r.optionId === o.id)?.n ?? 0;
      const pct = total ? Math.round((n / total) * 100) : 0;
      return `<li><span>${escapeHtml(o.text)}</span><b>${pct}%</b></li>`;
    }).join('')}</ul>\n` +
    `        <div class="counts">${total} ${escapeHtml(ui.votes)} · ${profile.results?.countries ?? 0} ${escapeHtml(ui.countries)}</div>\n` +
    `        <a class="cta" href="${appUrl}">${escapeHtml(ui.cta)} &rarr;</a>\n` +
    `      </div>\n    </article>\n` +
    `    <p class="tag">${escapeHtml(ui.tagline)}</p>\n` +
    `  </div>\n</body>\n</html>\n`;
}

// Minimal page for a miss: 404 body when the opinio is genuinely gone, a soft
// "view on Opinio" page on a transient API outage (served 200 so crawlers keep
// the URL). Either way, never a redirect.
function renderLangMiss(lang, id, notFound) {
  const ui = LANG_UI[lang];
  const msg = notFound ? ui.gone : ui.tagline;
  return '<!DOCTYPE html>\n' +
    `<html lang="${lang}">\n<head>\n    <meta charset="utf-8" />\n` +
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    `    <title>Opinio</title>\n    ${FAVICON_LINKS}\n    <meta name="robots" content="${notFound ? 'noindex' : 'noindex'}" />\n` +
    `    <style>${LANG_PAGE_CSS}</style>\n</head>\n<body>\n  <div class="wrap">\n` +
    `    <header><a href="${SITE_BASE}/">Opin<span>io</span></a></header>\n` +
    `    <p class="tag" style="margin-top:48px">${escapeHtml(msg)}</p>\n` +
    `    <p style="text-align:center"><a class="cta" href="${SITE_BASE}/p/${id}">${escapeHtml(ui.home)} &rarr;</a></p>\n` +
    `  </div>\n</body>\n</html>\n`;
}

async function handleProfileLang(request, id, lang) {
  const [result, paths] = await Promise.all([fetchProfile(id, lang), fetchAdvertisedPaths()]);
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');

  if (!result.ok) {
    // No SPA route backs these URLs, so we can't fall back to the shell — render
    // a small standalone miss page instead. 410 when genuinely gone (same as
    // the bare /p/); 200 on a transient outage so crawlers don't drop a live
    // translated URL.
    headers.set('x-opinio-og', result.notFound ? 'notfound' : 'fallback');
    return new Response(renderLangMiss(lang, id, result.notFound), {
      status: result.notFound ? 410 : 200,
      headers,
    });
  }

  headers.set('x-opinio-og', 'profile-lang');
  const noindex = isUnadvertised(paths, `/p/${id}`);
  if (noindex) headers.set('x-robots-tag', NOINDEX);
  return new Response(renderLangPage({ id, lang, profile: result.data, noindex }), { status: 200, headers });
}

// lang = null → bare English page (/u/<id>); lang set → prefixed page
// (/<lang>/u/<id>): same SPA shell, but self-canonical points at the prefixed
// URL and og:locale flips so crawlers tie it to the right language. The SPA
// reads the locale from the URL prefix and renders the body translated.
async function handleUser(request, id, lang = null) {
  const [result, shellRes, paths] = await Promise.all([
    fetchUser(id),
    fetchShellHtml(request),
    fetchAdvertisedPaths(),
  ]);

  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');

  if (!result.ok) {
    // Upstream 404 → genuine not-found → SEO 404 (still serve the friendly
    // shell so the SPA renders its client-side not-found UI). Any other
    // failure (5xx / network / timeout) is a transient API outage and must
    // keep returning the 200 shell so crawlers don't drop live users.
    headers.set('x-opinio-og', result.notFound ? 'notfound' : 'fallback');
    return new Response(shellText, { status: result.notFound ? 404 : 200, headers });
  }

  const user = result.data;
  headers.set('x-opinio-og', lang ? 'user-lang' : 'user');

  const title = `@${user.displayName} - Opinio`;
  // profileCount is the true total; `profiles` is the older list-shaped field.
  const profileCount = user.profileCount ?? (Array.isArray(user.profiles) ? user.profiles.length : 0);
  // A written bio is unique per user, so it beats the generated sentence.
  // The fallback counts votes RECEIVED: /api/users/:id never returned
  // totalLikesCast, so the old wording said "0 likes cast" for everyone.
  const description = truncate(
    user.bio?.trim() ||
      `@${user.displayName} on Opinio - ${profileCount} poll${profileCount === 1 ? '' : 's'} asked, ` +
      `${user.pollsAnswered || 0} answered.`,
    200,
  );
  const hasAvatar = !!user.avatarUrl;
  const image = hasAvatar ? upscaleAvatarUrl(user.avatarUrl) : ANON_OG_IMAGE;
  const imageAlt = hasAvatar ? user.displayName : 'Anonymous Opinio user';
  const basePath = `/u/${id}`;
  const canonicalUrl = lang ? `${SITE_BASE}/${lang}${basePath}` : `${SITE_BASE}${basePath}`;
  const noindex = isUnadvertised(paths, basePath);
  if (noindex) headers.set('x-robots-tag', NOINDEX);

  const html = injectProfileMeta(shellText, {
    title,
    description,
    image,
    imageAlt,
    url: canonicalUrl,
    isAvatar: true, // both avatar and anon mask are square — use small twitter card
    alternatesBase: basePath,
    ogLocale: lang ? LANG_UI[lang].ogLocale : null,
    noindex,
  });

  return new Response(html, { status: 200, headers });
}

// SPA routes that the React Router knows about but S3 doesn't have files for.
// Without these the bucket returns 404, the SPA still renders client-side, but
// crawlers see the 404 and skip indexing. Each entry is invoked through the
// matching wrangler.toml route, served as /index.html with a 200 status, and
// gets a per-page title/description for SEO and social previews.
const STATIC_PAGES = {
  '/about': {
    title: 'About Opinio - the world poll',
    description: 'What Opinio is: anyone can ask, people everywhere vote in their own language, and the map shows how each country answered. No ads, no tracking.',
  },
  '/privacy': {
    title: 'Privacy - Opinio',
    description: 'What Opinio collects, why, how long it is kept, and your rights under GDPR.',
  },
  '/terms': {
    title: 'Terms - Opinio',
    description: 'Opinio terms: posting rules, voting, subscriptions and account blocks.',
  },
  '/stats': {
    title: 'Most divided polls and top polls - Opinio',
    description: 'The polls that split the world most evenly, and the ones with the most votes on Opinio.',
  },
  '/stats/trending-countries': {
    title: 'Most active countries - Opinio',
    description: 'Which countries vote the most on Opinio, today and overall.',
  },
  '/stats/top-voters': {
    title: 'Top askers and voters - Opinio',
    description: 'The people whose polls get the most votes, and those who answer the most polls on Opinio.',
  },
  '/support': {
    title: 'Support - Opinio',
    description: 'Contact Opinio support, follow your tickets and get help with polls, voting and your account.',
  },
  '/add': {
    title: 'Ask the world - Opinio',
    description: 'Create a poll with up to 5 answers and see how every country votes.',
  },
  '/sign-in': {
    title: 'Sign in - Opinio',
    description: 'Sign in with Google or Microsoft to vote on every poll, ask your own and join the discussion.',
  },
};

// Localized title/description for the SERVER-RENDERED shell of prefixed static
// pages (/<lang>/about …) + the prefixed home (/<lang>, key '/'). Needed because
// the SPA's applySeo would otherwise overwrite the shell title with English on
// hydration; here we set the right language up front so non-JS social scrapers +
// the first paint are correct too. MUST stay in sync with the React i18n `seo`
// block in opinio-fe/src/i18n/strings.ts (same strings, two render paths).
const STATIC_I18N = {
  cs: {
    '/': { title: 'Opinio - Zeptej se světa, uvidíš, jak hlasuje každá země', description: 'Zeptej se světa na cokoli a hlasuj v anketách ve svém jazyce. Na mapě světa uvidíš, jak odpověděli lidé v každé zemi. Bez reklam, z Evropy.' },
    '/about': { title: 'O Opinio - světová anketa', description: 'Co je Opinio: kdokoli se může zeptat, lidé z celého světa hlasují ve svém jazyce a mapa ukáže, jak odpověděla každá země. Bez reklam, bez sledování.' },
    '/privacy': { title: 'Zásady ochrany soukromí - Opinio', description: 'Co Opinio shromažďuje, proč, jak dlouho to uchovává a jaká máš práva podle GDPR.' },
    '/terms': { title: 'Podmínky použití - Opinio', description: 'Podmínky Opinio: pravidla pro příspěvky, hlasování, předplatné a blokace účtu.' },
    '/stats': { title: 'Nejrozdělenější a nejoblíbenější ankety - Opinio', description: 'Ankety, ve kterých je svět rozdělený nejtěsněji, a ty s nejvíce hlasy na Opinio.' },
    '/stats/trending-countries': { title: 'Nejaktivnější země - Opinio', description: 'Které země na Opinio hlasují nejvíc, dnes i celkově.' },
    '/stats/top-voters': { title: 'Nejlepší tazatelé a hlasující - Opinio', description: 'Lidé, jejichž ankety získávají nejvíc hlasů, a ti, kteří na Opinio odpovídají na nejvíc anket.' },
    '/support': { title: 'Podpora - Opinio', description: 'Kontaktuj podporu Opinio, sleduj své tikety a získej pomoc s anketami, hlasováním a účtem.' },
  },
  es: {
    '/': { title: 'Opinio - Pregunta al mundo y mira cómo vota cada país', description: 'Pregunta al mundo lo que quieras y vota encuestas en tu idioma. Mira en el mapa cómo respondió la gente de cada país. Sin anuncios, hecho en Europa.' },
    '/about': { title: 'Acerca de Opinio - la encuesta mundial', description: 'Qué es Opinio: cualquiera puede preguntar, gente de todo el mundo vota en su idioma y el mapa muestra cómo respondió cada país. Sin anuncios, sin rastreo.' },
    '/privacy': { title: 'Aviso de privacidad - Opinio', description: 'Qué recopila Opinio, por qué, cuánto tiempo lo conserva y tus derechos según el RGPD.' },
    '/terms': { title: 'Términos de uso - Opinio', description: 'Términos de Opinio: reglas de publicación, votación, suscripciones y bloqueos de cuenta.' },
    '/stats': { title: 'Encuestas más divididas y más votadas - Opinio', description: 'Las encuestas que dividen al mundo de forma más pareja y las que tienen más votos en Opinio.' },
    '/stats/trending-countries': { title: 'Países más activos - Opinio', description: 'Qué países votan más en Opinio, hoy y en total.' },
    '/stats/top-voters': { title: 'Quienes más preguntan y votan - Opinio', description: 'Las personas cuyas encuestas reciben más votos y las que más encuestas responden en Opinio.' },
    '/support': { title: 'Soporte - Opinio', description: 'Contacta con el soporte de Opinio, sigue tus tickets y obtén ayuda con encuestas, votación y tu cuenta.' },
  },
  de: {
    '/': { title: 'Opinio - Frag die Welt, sieh, wie jedes Land abstimmt', description: 'Frag die Welt, was du willst, und stimme in deiner Sprache ab. Auf der Weltkarte siehst du, wie die Menschen in jedem Land geantwortet haben. Werbefrei, aus Europa.' },
    '/about': { title: 'Über Opinio - die Weltumfrage', description: 'Was Opinio ist: Jeder kann fragen, Menschen überall stimmen in ihrer Sprache ab, und die Karte zeigt, wie jedes Land geantwortet hat. Keine Werbung, kein Tracking.' },
    '/privacy': { title: 'Datenschutzhinweis - Opinio', description: 'Was Opinio erfasst, warum, wie lange es gespeichert wird und welche Rechte du nach der DSGVO hast.' },
    '/terms': { title: 'Nutzungsbedingungen - Opinio', description: 'Opinio-Bedingungen: Regeln für Beiträge, Abstimmung, Abos und Kontosperren.' },
    '/stats': { title: 'Die umstrittensten und meistgewählten Umfragen - Opinio', description: 'Die Umfragen, die die Welt am gleichmäßigsten spalten, und die mit den meisten Stimmen auf Opinio.' },
    '/stats/trending-countries': { title: 'Die aktivsten Länder - Opinio', description: 'Welche Länder auf Opinio am meisten abstimmen, heute und insgesamt.' },
    '/stats/top-voters': { title: 'Top-Fragesteller und Abstimmende - Opinio', description: 'Die Menschen, deren Umfragen die meisten Stimmen bekommen, und die, die auf Opinio die meisten Umfragen beantworten.' },
    '/support': { title: 'Support - Opinio', description: 'Kontaktiere den Opinio-Support, verfolge deine Tickets und erhalte Hilfe zu Umfragen, Abstimmung und deinem Konto.' },
  },
  fr: {
    '/': { title: 'Opinio - Interrogez le monde, voyez comment vote chaque pays', description: 'Posez n\'importe quelle question au monde et votez dans votre langue. Voyez sur la carte comment les gens de chaque pays ont répondu. Sans publicité, fait en Europe.' },
    '/about': { title: 'À propos d\'Opinio - le sondage mondial', description: 'Ce qu\'est Opinio : chacun peut poser une question, les gens du monde entier votent dans leur langue et la carte montre comment chaque pays a répondu. Sans pub, sans pistage.' },
    '/privacy': { title: 'Avis de confidentialité - Opinio', description: 'Ce qu\'Opinio collecte, pourquoi, combien de temps et vos droits au titre du RGPD.' },
    '/terms': { title: "Conditions d'utilisation - Opinio", description: 'Conditions d\'Opinio : règles de publication, vote, abonnements et blocages de compte.' },
    '/stats': { title: 'Sondages les plus partagés et les plus votés - Opinio', description: 'Les sondages qui divisent le plus le monde, et ceux qui comptent le plus de votes sur Opinio.' },
    '/stats/trending-countries': { title: 'Pays les plus actifs - Opinio', description: 'Les pays qui votent le plus sur Opinio, aujourd\'hui et au total.' },
    '/stats/top-voters': { title: 'Meilleurs auteurs et votants - Opinio', description: 'Les personnes dont les sondages recueillent le plus de votes, et celles qui répondent au plus de sondages sur Opinio.' },
    '/support': { title: 'Assistance - Opinio', description: 'Contactez l\'assistance Opinio, suivez vos demandes et obtenez de l\'aide sur les sondages, le vote et votre compte.' },
  },
  it: {
    '/': { title: 'Opinio - Chiedi al mondo, guarda come vota ogni paese', description: 'Chiedi al mondo qualsiasi cosa e vota i sondaggi nella tua lingua. Guarda sulla mappa come ha risposto la gente di ogni paese. Senza pubblicità, fatto in Europa.' },
    '/about': { title: 'Informazioni su Opinio - il sondaggio mondiale', description: 'Cos\'è Opinio: chiunque può chiedere, persone di tutto il mondo votano nella propria lingua e la mappa mostra come ha risposto ogni paese. Niente pubblicità, nessun tracciamento.' },
    '/privacy': { title: 'Informativa sulla privacy - Opinio', description: 'Cosa raccoglie Opinio, perché, per quanto tempo e i tuoi diritti ai sensi del GDPR.' },
    '/terms': { title: "Termini di utilizzo - Opinio", description: 'Termini di Opinio: regole di pubblicazione, voto, abbonamenti e blocchi dell\'account.' },
    '/stats': { title: 'Sondaggi più divisivi e più votati - Opinio', description: 'I sondaggi che dividono il mondo in modo più equilibrato e quelli con più voti su Opinio.' },
    '/stats/trending-countries': { title: 'Paesi più attivi - Opinio', description: 'Quali paesi votano di più su Opinio, oggi e in totale.' },
    '/stats/top-voters': { title: 'Chi chiede e vota di più - Opinio', description: 'Le persone i cui sondaggi ricevono più voti e quelle che rispondono a più sondaggi su Opinio.' },
    '/support': { title: 'Assistenza - Opinio', description: 'Contatta l\'assistenza di Opinio, segui i tuoi ticket e ricevi aiuto su sondaggi, voto e account.' },
  },
  pl: {
    '/': { title: 'Opinio - Zapytaj świat, zobacz, jak głosuje każdy kraj', description: 'Zapytaj świat o cokolwiek i głosuj w ankietach w swoim języku. Na mapie świata zobaczysz, jak odpowiedzieli ludzie w każdym kraju. Bez reklam, z Europy.' },
    '/about': { title: 'O Opinio - światowa ankieta', description: 'Czym jest Opinio: każdy może zapytać, ludzie z całego świata głosują w swoim języku, a mapa pokazuje, jak odpowiedział każdy kraj. Bez reklam, bez śledzenia.' },
    '/privacy': { title: 'Polityka prywatności - Opinio', description: 'Co zbiera Opinio, dlaczego, jak długo to przechowuje i jakie masz prawa według RODO.' },
    '/terms': { title: 'Regulamin - Opinio', description: 'Regulamin Opinio: zasady publikowania, głosowanie, subskrypcje i blokady kont.' },
    '/stats': { title: 'Najbardziej podzielone i najpopularniejsze ankiety - Opinio', description: 'Ankiety, które najrówniej dzielą świat, i te z największą liczbą głosów na Opinio.' },
    '/stats/trending-countries': { title: 'Najaktywniejsze kraje - Opinio', description: 'Które kraje głosują najwięcej na Opinio, dziś i łącznie.' },
    '/stats/top-voters': { title: 'Najlepsi pytający i głosujący - Opinio', description: 'Osoby, których ankiety zbierają najwięcej głosów, i te, które odpowiadają na najwięcej ankiet na Opinio.' },
    '/support': { title: 'Pomoc - Opinio', description: 'Skontaktuj się z pomocą Opinio, śledź swoje zgłoszenia i uzyskaj pomoc z ankietami, głosowaniem i kontem.' },
  },
};

// path is the bare page path (e.g. "/about"). lang = null → bare English;
// lang set → prefixed (/<lang>/about): self-canonical + og:locale flip + the
// SPA renders the body in-locale (title/description stay English in the shell
// and the SPA overwrites them at runtime — Googlebot runs JS and indexes the
// translated values).
async function handleStatic(request, page, path, lang = null) {
  const shellRes = await fetchShellHtml(request);
  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');
  headers.set('x-opinio-og', lang ? 'static-lang' : 'static');
  // Localized shell title/description for prefixed pages (falls back to the
  // English STATIC_PAGES copy when a page has no translation, e.g. /add).
  const loc = lang ? STATIC_I18N[lang]?.[path] : null;
  const html = injectProfileMeta(shellText, {
    title: loc?.title ?? page.title,
    description: loc?.description ?? page.description,
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Opinio',
    url: lang ? `${SITE_BASE}/${lang}${path}` : `${SITE_BASE}${path}`,
    isAvatar: false,
    alternatesBase: path,
    ogLocale: lang ? LANG_UI[lang].ogLocale : null,
  });
  return new Response(html, { status: 200, headers });
}

// Home page. lang = null → bare English home ("/"): fronted by the worker (not
// served straight from S3) purely so it can emit the reciprocal hreflang set +
// alternates that S3 can't inject; title/description stay the shell's English
// defaults (byte-identical, no copy change). lang set → prefixed home (/<lang>):
// translated meta scaffolding + og:locale flip. Both are the SPA shell with
// HEAD-ONLY injection — the visible home UI (including its <h1>) is rendered by
// the SPA in the active locale, so nothing here is language-specific body text.
// Trailing slash on the prefixed canonical keeps it byte-identical to the
// hreflang "/<lang>/" entry.
async function handleHome(request, lang = null) {
  const shellRes = await fetchShellHtml(request);
  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');
  headers.set('x-opinio-og', lang ? 'home-lang' : 'home');
  const loc = lang ? STATIC_I18N[lang]?.['/'] : null;
  const html = injectProfileMeta(shellText, {
    title: loc?.title ?? 'Opinio - Ask the world, see how every country votes',
    description: loc?.description ?? 'Ask the world anything and vote on polls in your own language. See how people in every country answered, live on the world map. Ad-free, made in Europe.',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Opinio',
    url: lang ? `${SITE_BASE}/${lang}/` : `${SITE_BASE}/`,
    isAvatar: false,
    alternatesBase: '/',
    ogLocale: lang ? LANG_UI[lang].ogLocale : null,
  });
  return new Response(html, { status: 200, headers });
}

// /news and /n/<id>: news is gone for good, so every such URL is 410 Gone
// (Google drops it faster than a 404 and stops recrawling). The shell is still
// served, so a person following an old link lands in the app.
async function handleNews(request) {
  const shellRes = await fetchShellHtml(request);
  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');
  headers.set('x-opinio-og', 'gone');
  headers.set('x-robots-tag', NOINDEX);
  return new Response(shellText, { status: 410, headers });
}

// lang = null → bare English (/c/<code>); lang set → prefixed (/<lang>/c/<code>),
// with the country name from COUNTRY_NAMES_I18N.
async function handleCountry(request, code, lang = null) {
  const [shellRes, paths] = await Promise.all([
    fetchShellHtml(request),
    fetchAdvertisedPaths(),
  ]);
  const shellText = await shellRes.text();
  const headers = new Headers();
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'public, max-age=300, s-maxage=300');

  const name = countryName(code, lang);
  if (!name) {
    // Country list is hardcoded in COUNTRY_NAMES (no upstream call to fail),
    // so an unknown code is a genuine not-found with no outage risk → SEO 404.
    // Still serve the friendly shell so the SPA renders its not-found UI.
    headers.set('x-opinio-og', 'notfound');
    return new Response(shellText, { status: 404, headers });
  }

  headers.set('x-opinio-og', lang ? 'country-lang' : 'country');
  const seo = COUNTRY_SEO[lang] || COUNTRY_SEO.en;
  const fill = (tpl) => tpl.replace(/\{country\}/g, name);
  const title = fill(seo.title);
  const description = fill(seo.description);
  const basePath = `/c/${code}`;
  const canonicalUrl = lang ? `${SITE_BASE}/${lang}${basePath}` : `${SITE_BASE}${basePath}`;
  const noindex = isUnadvertised(paths, basePath);
  if (noindex) headers.set('x-robots-tag', NOINDEX);

  const html = injectProfileMeta(shellText, {
    title,
    description,
    image: DEFAULT_OG_IMAGE,
    imageAlt: `Opinio · ${name}`,
    url: canonicalUrl,
    isAvatar: false,
    alternatesBase: basePath,
    ogLocale: lang ? LANG_UI[lang].ogLocale : null,
    noindex,
  });
  return new Response(html, { status: 200, headers });
}

// Dispatch a /<lang>/... path (lang already validated) to the right handler.
// `inner` is the bare-equivalent path (the /<lang> prefix stripped). Profiles
// are handled earlier (standalone render); here we cover user / country / static
// / home, all served as the SPA shell with translated meta.
function handleLangPrefixed(request, lang, inner) {
  const userMatch = inner.match(USER_PATH_RE);
  if (userMatch) {
    const id = userMatch[1].toLowerCase();
    if (!UUID_RE.test(id)) return fetch(request);
    return handleUser(request, id, lang);
  }

  const countryMatch = inner.match(COUNTRY_PATH_RE);
  if (countryMatch) {
    const code = countryMatch[1].toUpperCase();
    if (!COUNTRY_CODE_RE.test(code)) return fetch(request);
    return handleCountry(request, code, lang);
  }

  if (inner === '/' || inner === '') {
    return handleHome(request, lang);
  }

  if (NEWS_PATH_RE.test(inner)) {
    return handleNews(request);
  }

  const staticPage = STATIC_PAGES[inner];
  if (staticPage) {
    return handleStatic(request, staticPage, inner, lang);
  }

  // Unknown prefixed path (e.g. /fr/settings, /fr/typo) — serve the shell with
  // the home scaffolding so the SPA can render or 404 client-side, but keep the
  // canonical on the prefixed URL so it isn't mistaken for an English dupe.
  return handleHome(request, lang);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/sitemap.xml') {
      return handleSitemap();
    }

    // Bare English home — served through the worker (not straight from S3) so it
    // emits the reciprocal hreflang set. Head-only injection; the SPA still
    // renders the visible home UI. Query strings (e.g. /?country=US) keep path "/".
    if (path === '/' || path === '') {
      return handleHome(request, null);
    }

    // /<lang>/p/<id> — server-rendered standalone translated page (checked before
    // the generic /<lang>/... branch so it gets the full render, not the shell).
    const profileLangMatch = path.match(PROFILE_LANG_PATH_RE);
    if (profileLangMatch) {
      const lang = profileLangMatch[1].toLowerCase();
      const id = profileLangMatch[2].toLowerCase();
      if (!UUID_RE.test(id)) return fetch(request);
      return handleProfileLang(request, id, lang);
    }

    // Any other /<lang>/... path — SPA shell + translated meta.
    const langMatch = path.match(LANG_PREFIX_RE);
    if (langMatch) {
      const lang = langMatch[1].toLowerCase();
      const inner = langMatch[2] || '/';
      return handleLangPrefixed(request, lang, inner);
    }

    const staticPage = STATIC_PAGES[path];
    if (staticPage) {
      return handleStatic(request, staticPage, path);
    }

    if (NEWS_PATH_RE.test(path)) {
      return handleNews(request);
    }

    const profileMatch = path.match(PROFILE_PATH_RE);
    if (profileMatch) {
      const id = profileMatch[1].toLowerCase();
      if (!UUID_RE.test(id)) return fetch(request);
      return handleProfile(request, id);
    }

    const userMatch = path.match(USER_PATH_RE);
    if (userMatch) {
      const id = userMatch[1].toLowerCase();
      if (!UUID_RE.test(id)) return fetch(request);
      return handleUser(request, id);
    }

    const countryMatch = path.match(COUNTRY_PATH_RE);
    if (countryMatch) {
      const code = countryMatch[1].toUpperCase();
      if (!COUNTRY_CODE_RE.test(code)) return fetch(request);
      return handleCountry(request, code);
    }

    return fetch(request);
  },
};
