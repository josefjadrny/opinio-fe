export interface Strings {
  appName: string;
  trending: string;
  falling: string;
  addProfile: string;
  login: string;
  loginTooltip: string;
  loginWithGoogle: string;
  loginWithMicrosoft: string;
  signInPrompt: string;
  allCountries: string;
  allCategories: string;
  noProfiles: string;
  loading: string;
  cancel: string;
  adding: string;
  addProfileTitle: string;
  dropButton: string;
  statementLabel: string;
  statementPlaceholder: string;
  categoryLabel: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  photoLabel: string;
  photoChoose: string;
  photoChange: string;
  photoRemove: string;
  photoHint: string;
  imageUrlPlaceholder: string;
  yourNamePlaceholder: string;
  byAuthor: string;
  newBadge: string;
  clearFilters: string;
  searchLabel: string;
  searchPlaceholder: string;
  nominateTooltip: string;
  profile: string;
  settings: string;
  about: string;
  logout: string;
  displayName: string;
  country: string;
  profileCountry: string;
  detectedFromIp: string;
  anonymousUser: string;
  notLoggedIn: string;
  language: string;
  languageHint: string;
  upgradeBanner: string;
  manageSubscription: string;
  brandTagline: string;
  aboutPrinciplesTitle: string;
  aboutPrincipleTimeTitle: string;
  aboutPrincipleTimeBody: string;
  aboutPrinciplePrivacyTitle: string;
  aboutPrinciplePrivacyBody: string;
  aboutPrinciplePrivacyContactLink: string; // also reused as the "support" link label in Terms/Privacy
  aboutPrincipleVoiceTitle: string;
  aboutPrincipleVoiceBody: string;
  aboutMadeInCzechia: string;
  aboutHostedInGermany: string;
  aboutEuOrigin: string;
  aboutTiersTitle: string;
  aboutTierAnonymous: string;
  aboutTierRegistered: string;
  aboutTierRegisteredPromo: string;
  aboutTierSupporter: string;
  aboutTierSupporterPromo: string;
  aboutSupporterPriceNote: string;
  // votes-per-hour unit, by plural category of the count (one=1, few=2-4, many=5+)
  aboutVotesPerHourOne: string;
  aboutVotesPerHourFew: string;
  aboutVotesPerHourMany: string;
  welcomeTitle: string;
  welcomeBulletVote: string;
  welcomeBulletExpire: string;
  welcomeBulletRefill: string;
  welcomeCta: string;
  privacy: string;
  privacyLastUpdated: string;
  privacyOperatorTitle: string;
  privacyOperatorName: string;
  privacyOperatorBody: string;
  privacyDataTitle: string;
  privacyDataSignInTitle: string;
  privacyDataSignInBody: string;
  privacyDataVoteTitle: string;
  privacyDataVoteBody: string;
  privacyDataPrefsTitle: string;
  privacyDataPrefsBody: string;
  privacyDataSubscriptionTitle: string;
  privacyDataSubscriptionBody: string;
  privacyWhyTitle: string;
  privacyWhyBody: string;
  privacyCookiesTitle: string;
  privacyCookiesBody: string;
  privacyThirdPartiesTitle: string;
  privacyThirdPartiesBody: string;
  privacyRetentionTitle: string;
  privacyRetentionVotes: string;
  privacyRetentionProfiles: string;
  privacyRetentionAccounts: string;
  privacyRightsTitle: string;
  privacyRightsBody: string;
  privacyOpenSupport: string;
  terms: string;
  termsLastUpdated: string;
  termsOperatorTitle: string;
  termsOperatorBody: string;
  termsAcceptTitle: string;
  termsAcceptBody: string;
  termsRulesTitle: string;
  termsRulesIntro: string;
  termsRuleViolentTitle: string;
  termsRuleViolentBody: string;
  termsRuleHarassmentTitle: string;
  termsRuleHarassmentBody: string;
  termsRuleNudityTitle: string;
  termsRuleNudityBody: string;
  termsRuleImpersonationTitle: string;
  termsRuleImpersonationBody: string;
  termsRuleIllegalTitle: string;
  termsRuleIllegalBody: string;
  termsRuleSpamTitle: string;
  termsRuleSpamBody: string;
  termsBlockTitle: string;
  termsBlockBody: string;
  termsVotingTitle: string;
  termsVotingBody: string;
  termsSubscriptionTitle: string;
  termsSubscriptionBody: string;
  termsLiabilityTitle: string;
  termsLiabilityBody: string;
  termsChangesTitle: string;
  termsChangesBody: string;
  termsContactTitle: string;
  termsContactBody: string;
  blockedTitle: string;
  blockedBody: string;
  blockedFooterNote: string;
  blockedFooterNoteSupportLabel: string;
  blockedUntilLabel: string;
  buyUsCoffee: string;
  stats: string;
  statsTitle: string;
  statsCategoryVoters: string;
  statsCategoryProfiles: string;
  statsVotersDescription: string;
  statsProfilesDescription: string;
  statsVotes: string;
  statsPostsLabel: string;
  statsNoData: string;
  statsOverview: string;
  support: string;
  supportTitle: string;
  supportNewTicket: string;
  supportNoTickets: string;
  supportOverview: string;
  displayNameFormat: string;
  displayNameTaken: string;
  noCountryWarning: string;
  noCountryWarningRegistered: string;
  viewerMode: string;
  viewerModeBody: string;
  viewerModeSignIn: string;
  viewerModeNoCountryBody: string;
  viewerModeSetCountry: string;
  supportSignIn: string;
  supportTitleLabel: string;
  supportTitlePlaceholder: string;
  supportCategoryLabel: string;
  supportDescriptionLabel: string;
  supportDescriptionPlaceholder: string;
  supportSubmit: string;
  supportSubmitting: string;
  supportBack: string;
  supportClose: string;
  supportAdminReply: string;
  supportAdminNote: string;
  supportSave: string;
  supportStatusLabel: string;
  supportCategories: Record<string, string>;
  supportStatuses: Record<string, string>;
  roles: Record<string, string>;
  votesLeft: string;
  nextVote: string;
  agree: string;
  disagree: string;
  breakdownLiking: string;
  breakdownDisliking: string;
  share: string;
  linkCopied: string;
  userJoined: string;
  userLikesCast: string;
  userDislikesCast: string;
  userVotesCast: string;
  userReportedProfiles: string;
  userNoProfiles: string;
  userNotFoundLabel: string;
  userNotFoundTitle: string;
  userNotFoundBody: string;
  userNotFoundCta: string;
  reportedBy: string;
  justNow: string;
  justReported: string;
  delete: string;
  deleteProfile: string;
  deleteProfileConfirm: string;
  deleteProfileConfirmOneVote: string;
  deleteProfileConfirmManyVotes: string;
  deleting: string;
  close: string;
}

const en: Strings = {
  appName: 'OPINIO',
  trending: 'Rising',
  falling: 'Falling',
  addProfile: 'Opinio',
  login: 'Sign in',
  loginTooltip: 'Sign in',
  loginWithGoogle: 'Continue with Google',
  loginWithMicrosoft: 'Continue with Microsoft',
  signInPrompt: 'Choose how you\'d like to sign in.',
  allCountries: 'All Countries',
  allCategories: 'All Categories',
  noProfiles: 'No profiles yet',
  loading: 'Loading...',
  cancel: 'Cancel',
  adding: 'Adding...',
  addProfileTitle: 'Drop an opinio',
  dropButton: 'Drop',
  statementLabel: 'Statement',
  statementPlaceholder: 'Headline, name, or event…',
  categoryLabel: 'Category',
  descriptionLabel: 'Long story short',
  descriptionPlaceholder: 'Give it some context…',
  photoLabel: 'Avatar',
  photoChoose: 'Choose avatar',
  photoChange: 'Change avatar',
  photoRemove: 'Remove',
  photoHint: 'Will be cropped to 128×128',
  imageUrlPlaceholder: 'https://...',
  yourNamePlaceholder: 'Your name *',
  byAuthor: 'by {author}',
  newBadge: 'NEW',
  clearFilters: 'Clear filters',
  searchLabel: 'Search',
  searchPlaceholder: 'Search opinios…',
  nominateTooltip: 'Sign in to drop an opinio',
  profile: 'Profile',
  settings: 'Settings',
  about: 'About',
  logout: 'Log out',
  displayName: 'Display name',
  country: 'Country',
  profileCountry: 'Country of origin',
  detectedFromIp: 'Detected from your IP',
  anonymousUser: 'Anonymous',
  notLoggedIn: 'Not logged in',
  language: 'Language',
  languageHint: 'Changes the interface only, not the opinions',
  upgradeBanner: 'Become a supporter',
  manageSubscription: 'Manage subscription',
  brandTagline: 'Social voting platform from Europe 🇪🇺. Vote on the stories shaping the world today.',
  aboutPrinciplesTitle: 'Our principles',
  aboutPrincipleTimeTitle: 'We respect your time',
  aboutPrincipleTimeBody: 'No ads, no useless clicks, just opinions.',
  aboutPrinciplePrivacyTitle: 'We respect your privacy',
  aboutPrinciplePrivacyBody: "No tracking. We don't share your data with anyone.",
  aboutPrinciplePrivacyContactLink: 'support',
  aboutPrincipleVoiceTitle: 'We respect your opinion',
  aboutPrincipleVoiceBody: 'Rankings are calculated from votes - we never adjust the order or favor any opinion',
  aboutMadeInCzechia: 'Made in Czechia',
  aboutHostedInGermany: 'Hosted in Germany',
  aboutEuOrigin: 'EU origin',
  aboutTiersTitle: 'Plans',
  aboutTierAnonymous: 'Anonymous',
  aboutTierRegistered: 'Registered',
  aboutTierRegisteredPromo: 'Posting ✓',
  aboutTierSupporter: 'Supporter',
  aboutTierSupporterPromo: 'Extra votes ✓',
  aboutSupporterPriceNote: '€2.99/month',
  aboutVotesPerHourOne: 'vote / hr',
  aboutVotesPerHourFew: 'votes / hr',
  aboutVotesPerHourMany: 'votes / hr',
  welcomeTitle: 'Welcome to Opinio',
  welcomeBulletVote: 'Like or dislike statements, events, and public figures',
  welcomeBulletExpire: 'Votes expire after 24 hours, so rankings stay alive',
  welcomeBulletRefill: 'Each vote refills 1 hour after you cast it',
  welcomeCta: "Let's vote",
  privacy: 'Privacy',
  privacyLastUpdated: 'Last updated: April 30, 2026',
  privacyOperatorTitle: 'Operator',
  privacyOperatorName: 'Josef Jadrny, Prague, Czech Republic 🇨🇿 🇪🇺',
  privacyOperatorBody: 'Operator and data controller: {operator}. Contact: {email}.',
  privacyDataTitle: 'What we collect',
  privacyDataSignInTitle: 'When you sign in',
  privacyDataSignInBody: 'your name, email address, profile picture, and a unique ID from your sign-in provider.',
  privacyDataVoteTitle: 'When you vote',
  privacyDataVoteBody: 'your IP address, the country we detect from it, and your account ID.',
  privacyDataPrefsTitle: 'Your preferences',
  privacyDataPrefsBody: 'the language you have chosen and the country you have manually set (if any).',
  privacyDataSubscriptionTitle: 'When you subscribe',
  privacyDataSubscriptionBody: 'a Stripe customer ID, subscription ID, status, and the current period end date. Card numbers and billing details are handled and stored by Stripe — we never see or store them.',
  privacyWhyTitle: 'Why we collect it',
  privacyWhyBody: 'We collect this data only for the platform to function: to identify your account, prevent duplicate sign-ins, limit how many votes a single person or IP can cast per hour, show country breakdowns, default your country and language correctly, and keep paid Supporter subscriptions in sync.',
  privacyCookiesTitle: 'Cookies',
  privacyCookiesBody: 'We set a single signed cookie that keeps you signed in. We do not use any analytics, advertising, or tracking cookies.',
  privacyThirdPartiesTitle: 'Third parties',
  privacyThirdPartiesBody: 'We do not sell, rent, or share your data. Servers run on Amazon Web Services. Sign-in is handled by Google or Microsoft as identity providers — their respective privacy policies apply for that step. Payments are processed by Stripe — when you subscribe, your card and billing details are collected and stored by Stripe under their privacy policy. Cloudflare proxies traffic and detects your country from your IP.',
  privacyRetentionTitle: 'Retention',
  privacyRetentionVotes: 'Votes are deleted after 24 hours.',
  privacyRetentionProfiles: 'Profiles with no votes after 7 days are deleted automatically.',
  privacyRetentionAccounts: 'User accounts inactive for 6 months are deleted automatically.',
  privacyRightsTitle: 'Your rights',
  privacyRightsBody: 'Under GDPR you have the right to access, correct, or delete your data, or to object to processing. Contact us through {support} or by email at {email}. We respond within 7 days.',
  privacyOpenSupport: 'Open support',
  terms: 'Terms',
  termsLastUpdated: 'Last updated: May 1, 2026',
  termsOperatorTitle: 'Operator',
  termsOperatorBody: 'Operator: {operator}. Contact: {email}.',
  termsAcceptTitle: 'Using Opinio',
  termsAcceptBody: 'Opinio is a public voting platform. By using it you agree to these terms. Keep it simple: be civil, be honest, and respect other people.',
  termsRulesTitle: 'Posting rules',
  termsRulesIntro: 'When you submit a statement, profile, photo, or description, the following are not allowed:',
  termsRuleViolentTitle: 'No violence',
  termsRuleViolentBody: 'no threats, calls for violence, or content that glorifies harming people.',
  termsRuleHarassmentTitle: 'No aggression or harassment',
  termsRuleHarassmentBody: 'no insults, slurs, hate speech, or rude personal attacks against any individual or group.',
  termsRuleNudityTitle: 'No nudity or sexual content',
  termsRuleNudityBody: 'no nude photos, sexually explicit imagery, or pornographic material.',
  termsRuleImpersonationTitle: 'No impersonation',
  termsRuleImpersonationBody: 'do not pretend to be someone else, and do not submit profiles designed to deceive.',
  termsRuleIllegalTitle: 'No illegal content',
  termsRuleIllegalBody: 'no content that breaks the law in the EU or your country, including doxxing or private personal data.',
  termsRuleSpamTitle: 'No spam',
  termsRuleSpamBody: 'no advertising, link spam, scams, or duplicate submissions intended to manipulate rankings.',
  termsBlockTitle: 'When rules are broken',
  termsBlockBody: "If something you posted breaks these rules, we may delete it and temporarily block your account from posting new opinions. You can still vote during a posting block. The block automatically expires on the date shown in your account; we don't keep permanent black marks.",
  termsVotingTitle: 'Voting',
  termsVotingBody: 'Each tier has an hourly vote allowance. Votes expire after 24 hours. We do not refund or reissue votes that were used in error.',
  termsSubscriptionTitle: 'Supporter subscription',
  termsSubscriptionBody: 'The Supporter subscription is €2.99/month, billed by Stripe. You can cancel at any time from the Stripe customer portal. Your supporter benefits remain active until the end of the paid period. EU consumer law refund rights still apply through Stripe.',
  termsLiabilityTitle: 'No warranty',
  termsLiabilityBody: 'Opinio is provided as-is, without any warranty. Rankings reflect public votes and are not statements of fact about the people, events, or topics shown. We are not liable for content posted by users.',
  termsChangesTitle: 'Changes',
  termsChangesBody: 'We may update these terms occasionally. The "last updated" date above always shows when. Continuing to use Opinio after a change means you accept the new terms.',
  termsContactTitle: 'Contact',
  termsContactBody: 'Questions about these terms or content you saw? Reach us at {email} or through {support}.',
  blockedTitle: 'Posting suspended',
  blockedBody: 'Your account is currently blocked from posting new opinions because of a rules violation.',
  blockedFooterNote: 'If you believe this is a mistake, contact {support}.',
  blockedFooterNoteSupportLabel: 'support',
  blockedUntilLabel: 'Block expires',
  buyUsCoffee: 'Buy us a {coffee}',
  stats: 'Stats',
  statsTitle: 'Community Stats',
  statsCategoryVoters: '🏆 Top Voters',
  statsCategoryProfiles: '🔥 Trending Opinios',
  statsVotersDescription: 'Most active community members ranked by total votes cast (likes and dislikes combined, lifetime).',
  statsProfilesDescription: 'Members behind the most-voted opinions right now — ranked by total votes received on their active posts in the last 24 hours, likes and dislikes combined.',
  statsVotes: 'votes',
  statsPostsLabel: 'active posts',
  statsNoData: 'No data yet',
  statsOverview: 'See where the community is most active. Switch between top voters and trending opinions.',
  support: 'Support',
  supportTitle: 'Support',
  supportNewTicket: 'New ticket',
  supportNoTickets: 'No tickets yet',
  supportOverview: 'Have a question, found a bug, or want to request a feature? Open a ticket and we\'ll get back to you.',
  displayNameFormat: 'Only lowercase letters, numbers, and underscores (3-30 characters)',
  displayNameTaken: 'This handle is already taken',
  noCountryWarning: 'Viewer mode — sign in to vote.',
  noCountryWarningRegistered: 'Viewer mode — select country to vote.',
  viewerMode: 'Viewer mode',
  viewerModeBody: "We couldn't determine your country, so voting is currently unavailable. Sign in to confirm your location and access all features.",
  viewerModeSignIn: 'Sign in',
  viewerModeNoCountryBody: "You're signed in but your country isn't set, so voting is unavailable. Set it in settings to start voting.",
  viewerModeSetCountry: 'Open settings',
  supportSignIn: 'Sign in to access support',
  supportTitleLabel: 'Subject',
  supportTitlePlaceholder: 'Short description of the issue',
  supportCategoryLabel: 'Category',
  supportDescriptionLabel: 'Details',
  supportDescriptionPlaceholder: 'Please describe the issue in detail…',
  supportSubmit: 'Submit ticket',
  supportSubmitting: 'Submitting…',
  supportBack: 'Back',
  supportClose: 'Close ticket',
  supportAdminReply: 'Reply to user',
  supportAdminNote: 'Internal note',
  supportSave: 'Save',
  supportStatusLabel: 'Status',
  supportCategories: {
    bug: 'Bug',
    feature: 'Feature request',
    subscription: 'Subscription',
    account: 'Account',
    other: 'Other',
  },
  supportStatuses: {
    new: 'New',
    investigating: 'Investigating',
    waiting: 'Waiting',
    done: 'Done',
  },
  roles: {
    politics: 'Politics',
    entertainment: 'Entertainment',
    sports: 'Sports',
    business: 'Business',
    media: 'Media',
    health: 'Health',
    science: 'Science',
  },
  votesLeft: 'votes left',
  nextVote: 'next vote',
  agree: 'Like',
  disagree: 'Dislike',
  breakdownLiking: 'Liking',
  breakdownDisliking: 'Disliking',
  share: 'Share',
  linkCopied: 'Link copied',
  userJoined: 'Joined {date}',
  userLikesCast: 'likes cast',
  userDislikesCast: 'dislikes cast',
  userVotesCast: 'Votes cast',
  userReportedProfiles: 'Recent opinios',
  userNoProfiles: 'No active opinios',
  userNotFoundLabel: 'Not found',
  userNotFoundTitle: 'This person has left the building',
  userNotFoundBody: 'Their account is no longer here — maybe they took a break, or the link is a little off.',
  userNotFoundCta: 'Back to feed',
  reportedBy: 'reported by',
  justNow: 'just now',
  justReported: 'New opinio just dropped',
  delete: 'Delete',
  deleteProfile: 'Delete opinio',
  deleteProfileConfirm: 'Delete this opinio permanently?',
  deleteProfileConfirmOneVote: 'Delete this opinio and discard 1 vote?',
  deleteProfileConfirmManyVotes: 'Delete this opinio and discard {count} votes?',
  deleting: 'Deleting…',
  close: 'Close',
};

const cs: Strings = {
  appName: 'OPINIO',
  trending: 'Stoupající',
  falling: 'Klesající',
  addProfile: 'Opinio',
  login: 'Přihlásit se',
  loginTooltip: 'Přihlásit se',
  loginWithGoogle: 'Pokračovat přes Google',
  loginWithMicrosoft: 'Pokračovat přes Microsoft',
  signInPrompt: 'Vyberte způsob přihlášení.',
  allCountries: 'Všechny země',
  allCategories: 'Všechny kategorie',
  noProfiles: 'Zatím žádné profily',
  loading: 'Načítání...',
  cancel: 'Zrušit',
  adding: 'Přidávání...',
  addProfileTitle: 'Přidat opinio',
  dropButton: 'Přidat',
  statementLabel: 'Prohlášení',
  statementPlaceholder: 'Titulek, jméno nebo událost…',
  categoryLabel: 'Kategorie',
  descriptionLabel: 'Zkrátka řečeno',
  descriptionPlaceholder: 'Přidejte kontext…',
  photoLabel: 'Avatar',
  photoChoose: 'Vybrat avatar',
  photoChange: 'Změnit avatar',
  photoRemove: 'Odebrat',
  photoHint: 'Bude oříznut na 128×128',
  imageUrlPlaceholder: 'https://...',
  yourNamePlaceholder: 'Vaše jméno *',
  byAuthor: 'přidal {author}',
  newBadge: 'NOVÝ',
  clearFilters: 'Zrušit filtry',
  searchLabel: 'Hledat',
  searchPlaceholder: 'Hledat opinio…',
  nominateTooltip: 'Přihlaste se pro přidání opinio',
  profile: 'Profil',
  settings: 'Nastavení',
  about: 'O aplikaci',
  logout: 'Odhlásit',
  displayName: 'Zobrazované jméno',
  country: 'Země',
  profileCountry: 'Země původu',
  detectedFromIp: 'Zjištěno z vaší IP',
  anonymousUser: 'Anonymní',
  notLoggedIn: 'Nepřihlášen',
  upgradeBanner: 'Stát se podporovatelem',
  manageSubscription: 'Spravovat předplatné',
  language: 'Jazyk',
  languageHint: 'Mění jen rozhraní, ne názory',
  brandTagline: 'Evropská sociální hlasovací platforma 🇪🇺. Hlasuj o tématech, která utvářejí dnešní svět.',
  aboutPrinciplesTitle: 'Naše principy',
  aboutPrincipleTimeTitle: 'Respektujeme váš čas',
  aboutPrincipleTimeBody: 'Žádné reklamy, žádné zbytečné klikání, jen názory.',
  aboutPrinciplePrivacyTitle: 'Respektujeme vaše soukromí',
  aboutPrinciplePrivacyBody: 'Žádné sledování. Vaše data s nikým nesdílíme.',
  aboutPrinciplePrivacyContactLink: 'podpoře',
  aboutPrincipleVoiceTitle: 'Respektujeme váš názor',
  aboutPrincipleVoiceBody: 'Pořadí počítáme z hlasů - nikdy ho neupravujeme ani nezvýhodňujeme žádný názor',
  aboutMadeInCzechia: 'Vytvořeno v Česku',
  aboutHostedInGermany: 'Hostováno v Německu',
  aboutEuOrigin: 'Původ v EU',
  aboutTiersTitle: 'Plány',
  aboutTierAnonymous: 'Anonymní',
  aboutTierRegistered: 'Registrovaný',
  aboutTierRegisteredPromo: 'Přidávání ✓',
  aboutTierSupporter: 'Podporovatel',
  aboutTierSupporterPromo: 'Více hlasů ✓',
  aboutSupporterPriceNote: '2,99 €/měsíc',
  aboutVotesPerHourOne: 'hlas / hod',
  aboutVotesPerHourFew: 'hlasy / hod',
  aboutVotesPerHourMany: 'hlasů / hod',
  welcomeTitle: 'Vítej v Opinio',
  welcomeBulletVote: 'Lajkuj nebo zamítni témata, události a veřejné osobnosti',
  welcomeBulletExpire: 'Hlasy vyprší po 24 hodinách, žebříčky tak žijí',
  welcomeBulletRefill: 'Každý hlas se ti vrátí hodinu po hlasování',
  welcomeCta: 'Pojďme hlasovat',
  privacy: 'Ochrana osobních údajů',
  privacyLastUpdated: 'Aktualizováno: 30. dubna 2026',
  privacyOperatorTitle: 'Provozovatel',
  privacyOperatorName: 'Josef Jadrny, Praha, Česká republika 🇨🇿 🇪🇺',
  privacyOperatorBody: 'Provozovatel a správce údajů: {operator}. Kontakt: {email}.',
  privacyDataTitle: 'Co sbíráme',
  privacyDataSignInTitle: 'Při přihlášení',
  privacyDataSignInBody: 'vaše jméno, e-mailovou adresu, profilový obrázek a unikátní ID od poskytovatele přihlášení.',
  privacyDataVoteTitle: 'Při hlasování',
  privacyDataVoteBody: 'vaši IP adresu, zemi, kterou z ní zjistíme, a ID vašeho účtu.',
  privacyDataPrefsTitle: 'Vaše předvolby',
  privacyDataPrefsBody: 'jazyk, který jste si zvolili, a zemi, kterou jste si případně nastavili.',
  privacyDataSubscriptionTitle: 'Při předplatném',
  privacyDataSubscriptionBody: 'Stripe customer ID, ID předplatného, stav a datum konce aktuálního období. Čísla karet a fakturační údaje zpracovává a ukládá Stripe — my je nikdy nevidíme ani neukládáme.',
  privacyWhyTitle: 'Proč to sbíráme',
  privacyWhyBody: 'Tato data sbíráme jen aby platforma fungovala: pro identifikaci vašeho účtu, prevenci duplicitních přihlášení, omezení počtu hlasů jednoho uživatele nebo IP za hodinu, zobrazení rozpadu podle zemí, správné nastavení vaší země a jazyka a pro synchronizaci placených Supporter předplatných.',
  privacyCookiesTitle: 'Soubory cookie',
  privacyCookiesBody: 'Nastavujeme jednu podepsanou cookie pro přihlášení. Žádné analytické, reklamní ani sledovací cookies.',
  privacyThirdPartiesTitle: 'Třetí strany',
  privacyThirdPartiesBody: 'Vaše data neprodáváme, nepronajímáme ani je nesdílíme. Servery běží na Amazon Web Services. Přihlášení zajišťuje Google nebo Microsoft jako poskytovatelé identity — pro tento krok platí jejich zásady ochrany. Platby zpracovává Stripe — při předplatném vaše údaje karty a fakturační údaje sbírá a ukládá Stripe podle svých zásad ochrany. Cloudflare proxuje provoz a detekuje zemi z vaší IP.',
  privacyRetentionTitle: 'Doba uchování',
  privacyRetentionVotes: 'Hlasy mažeme po 24 hodinách.',
  privacyRetentionProfiles: 'Profily bez hlasů po 7 dnech mažeme automaticky.',
  privacyRetentionAccounts: 'Neaktivní uživatelské účty po 6 měsících mažeme automaticky.',
  privacyRightsTitle: 'Vaše práva',
  privacyRightsBody: 'Podle GDPR máte právo na přístup ke svým údajům, jejich opravu nebo smazání, případně proti jejich zpracování vznést námitku. Pište přes {support} nebo e-mailem na {email}. Odpovídáme do 7 dnů.',
  privacyOpenSupport: 'Otevřít podporu',
  terms: 'Podmínky',
  termsLastUpdated: 'Aktualizováno: 1. května 2026',
  termsOperatorTitle: 'Provozovatel',
  termsOperatorBody: 'Provozovatel: {operator}. Kontakt: {email}.',
  termsAcceptTitle: 'Používání Opinia',
  termsAcceptBody: 'Opinio je veřejná hlasovací platforma. Používáním souhlasíte s těmito podmínkami. Jednoduše: chovejte se slušně, upřímně a s respektem k ostatním.',
  termsRulesTitle: 'Pravidla pro příspěvky',
  termsRulesIntro: 'Když přidáváte výrok, profil, fotku nebo popis, není dovoleno následující:',
  termsRuleViolentTitle: 'Žádné násilí',
  termsRuleViolentBody: 'žádné výhrůžky, výzvy k násilí ani obsah oslavující ubližování lidem.',
  termsRuleHarassmentTitle: 'Žádná agrese ani obtěžování',
  termsRuleHarassmentBody: 'žádné urážky, nadávky, nenávistné projevy ani hrubé osobní útoky vůči jednotlivcům nebo skupinám.',
  termsRuleNudityTitle: 'Žádná nahota ani sexuální obsah',
  termsRuleNudityBody: 'žádné nahé fotky, sexuálně explicitní materiály ani pornografický obsah.',
  termsRuleImpersonationTitle: 'Žádné vydávání se za někoho jiného',
  termsRuleImpersonationBody: 'nevydávejte se za jiné osoby a nevytvářejte profily určené k oklamání ostatních.',
  termsRuleIllegalTitle: 'Žádný nelegální obsah',
  termsRuleIllegalBody: 'žádný obsah, který porušuje zákony v EU nebo ve vaší zemi, včetně zveřejňování osobních údajů jiných lidí.',
  termsRuleSpamTitle: 'Žádný spam',
  termsRuleSpamBody: 'žádná reklama, spamování odkazů, podvody ani duplicitní příspěvky určené k manipulaci žebříčků.',
  termsBlockTitle: 'Když dojde k porušení pravidel',
  termsBlockBody: 'Pokud váš příspěvek porušuje tato pravidla, můžeme ho smazat a dočasně vám zablokovat přidávání nových názorů. Hlasovat můžete dál — blokace se týká jen nových příspěvků. Blokace automaticky vyprší v datu uvedeném u vašeho účtu; trvalé záznamy si nevedeme.',
  termsVotingTitle: 'Hlasování',
  termsVotingBody: 'Každá úroveň má hodinový limit hlasů. Hlasy vyprší po 24 hodinách. Hlasy použité omylem nevracíme ani nedoplňujeme.',
  termsSubscriptionTitle: 'Předplatné Supporter',
  termsSubscriptionBody: 'Předplatné Supporter stojí 2,99 € měsíčně a fakturuje ho Stripe. Můžete ho kdykoli zrušit přes zákaznický portál Stripu. Výhody zůstávají aktivní do konce zaplaceného období. Práva spotřebitelů na vrácení peněz podle EU práva platí prostřednictvím Stripu.',
  termsLiabilityTitle: 'Bez záruk',
  termsLiabilityBody: 'Opinio je poskytováno tak, jak je, bez jakýchkoli záruk. Žebříčky odrážejí veřejné hlasování a nejsou věcným tvrzením o zobrazených osobách, událostech nebo tématech. Neneseme odpovědnost za obsah přidaný uživateli.',
  termsChangesTitle: 'Změny',
  termsChangesBody: 'Tyto podmínky můžeme čas od času upravit. Datum "aktualizováno" výše vždy ukazuje kdy. Pokračováním v používání po změně podmínek s nimi souhlasíte.',
  termsContactTitle: 'Kontakt',
  termsContactBody: 'Máte otázky k těmto podmínkám nebo k obsahu, který jste viděli? Pište na {email} nebo přes {support}.',
  blockedTitle: 'Přidávání pozastaveno',
  blockedBody: 'Váš účet má dočasně zablokované přidávání nových názorů kvůli porušení pravidel.',
  blockedFooterNote: 'Pokud si myslíte, že jde o omyl, kontaktujte {support}.',
  blockedFooterNoteSupportLabel: 'podporu',
  blockedUntilLabel: 'Blokace končí',
  buyUsCoffee: 'Kup nám {coffee}',
  stats: 'Statistiky',
  statsTitle: 'Komunitní statistiky',
  statsCategoryVoters: '🏆 Top hlasující',
  statsCategoryProfiles: '🔥 Trendující opinio',
  statsVotersDescription: 'Nejaktivnější členové komunity podle celkového počtu hlasů (kladné i záporné dohromady, za celou dobu).',
  statsProfilesDescription: 'Uživatelé s nejaktivnějšími názory — řazeno podle celkového počtu hlasů na jejich aktivních příspěvcích za posledních 24 hodin, kladné i záporné dohromady.',
  statsVotes: 'hlasů',
  statsPostsLabel: 'aktivních příspěvků',
  statsNoData: 'Zatím žádná data',
  statsOverview: 'Podívejte se, kde je komunita nejaktivnější. Přepínejte mezi top hlasujícími a trendujícími názory.',
  support: 'Podpora',
  supportTitle: 'Podpora',
  supportNewTicket: 'Nový požadavek',
  supportNoTickets: 'Zatím žádné požadavky',
  supportOverview: 'Máte otázku, našli jste chybu nebo chcete navrhnout funkci? Otevřete požadavek a ozveme se vám.',
  displayNameFormat: 'Pouze malá písmena, číslice a podtržítka (3-30 znaků)',
  displayNameTaken: 'Toto jméno je již obsazeno',
  noCountryWarning: 'Režim diváka — pro hlasování se přihlaste.',
  noCountryWarningRegistered: 'Režim diváka — pro hlasování vyberte zemi.',
  viewerMode: 'Režim diváka',
  viewerModeBody: 'Nepodařilo se nám určit vaši zemi, hlasování je proto momentálně nedostupné. Přihlaste se pro ověření polohy a přístup ke všem funkcím.',
  viewerModeSignIn: 'Přihlásit se',
  viewerModeNoCountryBody: 'Jste přihlášeni, ale nemáte nastavenou zemi, takže hlasování není dostupné. Nastavte ji v nastavení a začněte hlasovat.',
  viewerModeSetCountry: 'Otevřít nastavení',
  supportSignIn: 'Přihlaste se pro přístup k podpoře',
  supportTitleLabel: 'Předmět',
  supportTitlePlaceholder: 'Krátký popis problému',
  supportCategoryLabel: 'Kategorie',
  supportDescriptionLabel: 'Podrobnosti',
  supportDescriptionPlaceholder: 'Popište problém podrobně…',
  supportSubmit: 'Odeslat požadavek',
  supportSubmitting: 'Odesílání…',
  supportBack: 'Zpět',
  supportClose: 'Uzavřít požadavek',
  supportAdminReply: 'Odpověď uživateli',
  supportAdminNote: 'Interní poznámka',
  supportSave: 'Uložit',
  supportStatusLabel: 'Stav',
  supportCategories: {
    bug: 'Chyba',
    feature: 'Nová funkce',
    subscription: 'Předplatné',
    account: 'Účet',
    other: 'Ostatní',
  },
  supportStatuses: {
    new: 'Nový',
    investigating: 'Prošetřujeme',
    waiting: 'Čeká',
    done: 'Vyřešeno',
  },
  roles: {
    politics: 'Politika',
    entertainment: 'Zábava',
    sports: 'Sport',
    business: 'Byznys',
    media: 'Média',
    health: 'Zdravotnictví',
    science: 'Věda',
  },
  votesLeft: 'zbývá hlasů',
  nextVote: 'příští hlas',
  agree: 'Líbí',
  disagree: 'Nelíbí',
  breakdownLiking: 'Líbí se',
  breakdownDisliking: 'Nelíbí se',
  share: 'Sdílet',
  linkCopied: 'Odkaz zkopírován',
  userJoined: 'Účet od {date}',
  userLikesCast: 'kladných hlasů',
  userDislikesCast: 'záporných hlasů',
  userVotesCast: 'Hlasování',
  userReportedProfiles: 'Nedávná opinio',
  userNoProfiles: 'Žádná aktivní opinio',
  userNotFoundLabel: 'Nenalezeno',
  userNotFoundTitle: 'Tento člověk tu už není',
  userNotFoundBody: 'Tento účet už neexistuje — třeba si dal pauzu, nebo je odkaz mírně přepsaný.',
  userNotFoundCta: 'Zpět na hlavní stranu',
  reportedBy: 'přidal',
  justNow: 'právě teď',
  justReported: 'Padlo nové opinio',
  delete: 'Smazat',
  deleteProfile: 'Smazat opinio',
  deleteProfileConfirm: 'Opravdu trvale smazat toto opinio?',
  deleteProfileConfirmOneVote: 'Smazat toto opinio a zahodit 1 hlas?',
  deleteProfileConfirmManyVotes: 'Smazat toto opinio a zahodit všech {count} hlasů?',
  deleting: 'Mazání…',
  close: 'Zavřít',
};

const es: Strings = {
  appName: 'OPINIO',
  trending: 'Subiendo',
  falling: 'Bajando',
  addProfile: 'Opinio',
  login: 'Iniciar sesión',
  loginTooltip: 'Iniciar sesión',
  loginWithGoogle: 'Continuar con Google',
  loginWithMicrosoft: 'Continuar con Microsoft',
  signInPrompt: 'Elige cómo quieres iniciar sesión.',
  allCountries: 'Todos los países',
  allCategories: 'Todas las categorías',
  noProfiles: 'Aún no hay perfiles',
  loading: 'Cargando...',
  cancel: 'Cancelar',
  adding: 'Añadiendo...',
  addProfileTitle: 'Dar un opinio',
  dropButton: 'Soltar',
  statementLabel: 'Declaración',
  statementPlaceholder: 'Titular, nombre o evento…',
  categoryLabel: 'Categoría',
  descriptionLabel: 'En pocas palabras',
  descriptionPlaceholder: 'Añade algo de contexto…',
  photoLabel: 'Avatar',
  photoChoose: 'Elegir avatar',
  photoChange: 'Cambiar avatar',
  photoRemove: 'Eliminar',
  photoHint: 'Se recortará a 128×128',
  imageUrlPlaceholder: 'https://...',
  yourNamePlaceholder: 'Tu nombre *',
  byAuthor: 'por {author}',
  newBadge: 'NUEVO',
  clearFilters: 'Borrar filtros',
  searchLabel: 'Buscar',
  searchPlaceholder: 'Buscar opinio…',
  nominateTooltip: 'Inicia sesión para dar un opinio',
  profile: 'Perfil',
  settings: 'Ajustes',
  about: 'Acerca de',
  logout: 'Cerrar sesión',
  displayName: 'Nombre visible',
  country: 'País',
  profileCountry: 'País de origen',
  detectedFromIp: 'Detectado desde tu IP',
  anonymousUser: 'Anónimo',
  notLoggedIn: 'No has iniciado sesión',
  upgradeBanner: 'Conviértete en supporter',
  manageSubscription: 'Gestionar suscripción',
  language: 'Idioma',
  languageHint: 'Cambia solo la interfaz, no las opiniones',
  brandTagline: 'Plataforma europea de votación social 🇪🇺. Vota sobre las historias que dan forma al mundo hoy.',
  aboutPrinciplesTitle: 'Nuestros principios',
  aboutPrincipleTimeTitle: 'Respetamos tu tiempo',
  aboutPrincipleTimeBody: 'Sin anuncios, sin clics inútiles, solo opiniones.',
  aboutPrinciplePrivacyTitle: 'Respetamos tu privacidad',
  aboutPrinciplePrivacyBody: 'Sin seguimiento. No compartimos tus datos con nadie.',
  aboutPrinciplePrivacyContactLink: 'soporte',
  aboutPrincipleVoiceTitle: 'Respetamos tu opinión',
  aboutPrincipleVoiceBody: 'El ranking se calcula a partir de los votos - nunca ajustamos el orden ni favorecemos ninguna opinión',
  aboutMadeInCzechia: 'Made in Czechia',
  aboutHostedInGermany: 'Hosted in Germany',
  aboutEuOrigin: 'EU origin',
  aboutTiersTitle: 'Planes',
  aboutTierAnonymous: 'Anonymous',
  aboutTierRegistered: 'Registered',
  aboutTierRegisteredPromo: 'Publicar ✓',
  aboutTierSupporter: 'Supporter',
  aboutTierSupporterPromo: 'Votos extra ✓',
  aboutSupporterPriceNote: '2,99 €/mes',
  aboutVotesPerHourOne: 'voto / h',
  aboutVotesPerHourFew: 'votos / h',
  aboutVotesPerHourMany: 'votos / h',
  welcomeTitle: 'Bienvenido a Opinio',
  welcomeBulletVote: 'Dale me gusta o no me gusta a opiniones, eventos y figuras públicas',
  welcomeBulletExpire: 'Los votos caducan a las 24 horas, así los rankings siguen vivos',
  welcomeBulletRefill: 'Cada voto se renueva 1 hora después de usarlo',
  welcomeCta: 'A votar',
  privacy: 'Privacidad',
  privacyLastUpdated: 'Actualizado: 30 de abril de 2026',
  privacyOperatorTitle: 'Responsable',
  privacyOperatorName: 'Josef Jadrny, Praga, República Checa 🇨🇿 🇪🇺',
  privacyOperatorBody: 'Responsable y encargado del tratamiento de datos: {operator}. Contacto: {email}.',
  privacyDataTitle: 'Qué recopilamos',
  privacyDataSignInTitle: 'Al iniciar sesión',
  privacyDataSignInBody: 'tu nombre, dirección de correo electrónico, foto de perfil y un identificador único de tu proveedor de inicio de sesión.',
  privacyDataVoteTitle: 'Al votar',
  privacyDataVoteBody: 'tu dirección IP, el país que detectamos a partir de ella y el ID de tu cuenta.',
  privacyDataPrefsTitle: 'Tus preferencias',
  privacyDataPrefsBody: 'el idioma que has elegido y el país que hayas configurado manualmente (si lo has hecho).',
  privacyDataSubscriptionTitle: 'Al suscribirte',
  privacyDataSubscriptionBody: 'un ID de cliente de Stripe, ID de suscripción, estado y la fecha de fin del período actual. Los números de tarjeta y los datos de facturación los gestiona y almacena Stripe — nosotros nunca los vemos ni los guardamos.',
  privacyWhyTitle: 'Por qué lo recopilamos',
  privacyWhyBody: 'Recopilamos estos datos únicamente para que la plataforma funcione: para identificar tu cuenta, evitar inicios de sesión duplicados, limitar cuántos votos puede emitir una misma persona o IP por hora, mostrar desgloses por país, configurar correctamente tu país e idioma por defecto, y mantener sincronizadas las suscripciones Supporter de pago.',
  privacyCookiesTitle: 'Cookies',
  privacyCookiesBody: 'Establecemos una única cookie firmada que mantiene tu sesión iniciada. No utilizamos ninguna cookie de analítica, publicidad ni seguimiento.',
  privacyThirdPartiesTitle: 'Terceros',
  privacyThirdPartiesBody: 'No vendemos, alquilamos ni compartimos tus datos. Los servidores funcionan en Amazon Web Services. El inicio de sesión lo gestiona Google o Microsoft como proveedores de identidad — para ese paso se aplican sus respectivas políticas de privacidad. Los pagos los procesa Stripe — cuando te suscribes, los datos de tu tarjeta y de facturación los recopila y almacena Stripe según su política de privacidad. Cloudflare actúa como proxy del tráfico y detecta tu país a partir de tu IP.',
  privacyRetentionTitle: 'Conservación',
  privacyRetentionVotes: 'Los votos se eliminan a las 24 horas.',
  privacyRetentionProfiles: 'Los perfiles sin votos tras 7 días se eliminan automáticamente.',
  privacyRetentionAccounts: 'Las cuentas de usuario inactivas durante 6 meses se eliminan automáticamente.',
  privacyRightsTitle: 'Tus derechos',
  privacyRightsBody: 'Conforme al RGPD, tienes derecho a acceder a tus datos, rectificarlos, suprimirlos u oponerte a su tratamiento. Contáctanos a través de {support} o por correo electrónico en {email}. Respondemos en un plazo de 7 días.',
  privacyOpenSupport: 'Abrir soporte',
  terms: 'Términos',
  termsLastUpdated: 'Actualizado: 1 de mayo de 2026',
  termsOperatorTitle: 'Responsable',
  termsOperatorBody: 'Responsable: {operator}. Contacto: {email}.',
  termsAcceptTitle: 'Uso de Opinio',
  termsAcceptBody: 'Opinio es una plataforma pública de votación. Al usarla aceptas estos términos. En resumen: sé respetuoso, honesto y considerado con los demás.',
  termsRulesTitle: 'Reglas para publicar',
  termsRulesIntro: 'Cuando envías una afirmación, un perfil, una foto o una descripción, lo siguiente no está permitido:',
  termsRuleViolentTitle: 'Sin violencia',
  termsRuleViolentBody: 'sin amenazas, llamamientos a la violencia ni contenido que glorifique hacer daño a las personas.',
  termsRuleHarassmentTitle: 'Sin agresión ni acoso',
  termsRuleHarassmentBody: 'sin insultos, descalificaciones, discurso de odio ni ataques personales groseros contra ninguna persona o grupo.',
  termsRuleNudityTitle: 'Sin desnudos ni contenido sexual',
  termsRuleNudityBody: 'sin fotos de desnudos, imágenes sexualmente explícitas ni material pornográfico.',
  termsRuleImpersonationTitle: 'Sin suplantación',
  termsRuleImpersonationBody: 'no te hagas pasar por otra persona ni crees perfiles diseñados para engañar.',
  termsRuleIllegalTitle: 'Sin contenido ilegal',
  termsRuleIllegalBody: 'sin contenido que infrinja la ley en la UE o en tu país, incluyendo doxxing o datos personales privados.',
  termsRuleSpamTitle: 'Sin spam',
  termsRuleSpamBody: 'sin publicidad, spam de enlaces, estafas ni publicaciones duplicadas para manipular los rankings.',
  termsBlockTitle: 'Cuando se infringen las reglas',
  termsBlockBody: 'Si lo que has publicado infringe estas reglas, podemos eliminarlo y bloquear temporalmente la creación de nuevas opiniones desde tu cuenta. Puedes seguir votando durante el bloqueo. El bloqueo expira automáticamente en la fecha indicada en tu cuenta; no mantenemos sanciones permanentes.',
  termsVotingTitle: 'Votación',
  termsVotingBody: 'Cada nivel tiene un límite de votos por hora. Los votos caducan a las 24 horas. No reembolsamos ni reponemos votos usados por error.',
  termsSubscriptionTitle: 'Suscripción Supporter',
  termsSubscriptionBody: 'La suscripción Supporter cuesta 2,99 €/mes y la factura Stripe. Puedes cancelarla en cualquier momento desde el portal de cliente de Stripe. Los beneficios se mantienen hasta el final del período pagado. Los derechos de reembolso del consumidor de la UE siguen aplicándose a través de Stripe.',
  termsLiabilityTitle: 'Sin garantías',
  termsLiabilityBody: 'Opinio se ofrece tal cual, sin ninguna garantía. Los rankings reflejan votos del público y no son afirmaciones de hecho sobre las personas, eventos o temas mostrados. No somos responsables del contenido publicado por los usuarios.',
  termsChangesTitle: 'Cambios',
  termsChangesBody: 'Podemos actualizar estos términos de vez en cuando. La fecha "actualizado" arriba siempre indica cuándo. Si sigues usando Opinio tras un cambio, aceptas los nuevos términos.',
  termsContactTitle: 'Contacto',
  termsContactBody: '¿Tienes preguntas sobre estos términos o sobre algún contenido? Escríbenos a {email} o a través de {support}.',
  blockedTitle: 'Publicación suspendida',
  blockedBody: 'Tu cuenta tiene temporalmente bloqueada la creación de nuevas opiniones por una infracción de las reglas.',
  blockedFooterNote: 'Si crees que se trata de un error, contacta con {support}.',
  blockedFooterNoteSupportLabel: 'soporte',
  blockedUntilLabel: 'El bloqueo termina',
  buyUsCoffee: 'Invítanos a un {coffee}',
  stats: 'Estadísticas',
  statsTitle: 'Estadísticas de la comunidad',
  statsCategoryVoters: '🏆 Top votantes',
  statsCategoryProfiles: '🔥 Opinio en tendencia',
  statsVotersDescription: 'Miembros más activos de la comunidad clasificados por el total de votos emitidos (positivos y negativos combinados, histórico).',
  statsProfilesDescription: 'Miembros detrás de las opiniones más votadas ahora mismo — clasificados por el total de votos en sus publicaciones activas durante las últimas 24 horas, positivos y negativos combinados.',
  statsVotes: 'votos',
  statsPostsLabel: 'publicaciones activas',
  statsNoData: 'Sin datos aún',
  statsOverview: 'Mira dónde la comunidad está más activa. Alterna entre los top votantes y las opiniones en tendencia.',
  support: 'Soporte',
  supportTitle: 'Soporte',
  supportNewTicket: 'Nuevo ticket',
  supportNoTickets: 'Sin tickets todavía',
  supportOverview: '¿Tienes una pregunta, encontraste un error o quieres sugerir una función? Abre un ticket y te responderemos.',
  displayNameFormat: 'Solo letras minúsculas, números y guiones bajos (3-30 caracteres)',
  displayNameTaken: 'Este nombre ya está en uso',
  noCountryWarning: 'Modo espectador — inicia sesión para votar.',
  noCountryWarningRegistered: 'Modo espectador — selecciona país para votar.',
  viewerMode: 'Modo espectador',
  viewerModeBody: 'No hemos podido determinar tu país, por lo que la votación no está disponible en este momento. Inicia sesión para confirmar tu ubicación y acceder a todas las funciones.',
  viewerModeSignIn: 'Iniciar sesión',
  viewerModeNoCountryBody: 'Has iniciado sesión pero no tienes país establecido, por lo que la votación no está disponible. Configúralo en ajustes para empezar a votar.',
  viewerModeSetCountry: 'Abrir ajustes',
  supportSignIn: 'Inicia sesión para acceder al soporte',
  supportTitleLabel: 'Asunto',
  supportTitlePlaceholder: 'Breve descripción del problema',
  supportCategoryLabel: 'Categoría',
  supportDescriptionLabel: 'Detalles',
  supportDescriptionPlaceholder: 'Describe el problema en detalle…',
  supportSubmit: 'Enviar ticket',
  supportSubmitting: 'Enviando…',
  supportBack: 'Volver',
  supportClose: 'Cerrar ticket',
  supportAdminReply: 'Respuesta al usuario',
  supportAdminNote: 'Nota interna',
  supportSave: 'Guardar',
  supportStatusLabel: 'Estado',
  supportCategories: {
    bug: 'Error',
    feature: 'Nueva función',
    subscription: 'Suscripción',
    account: 'Cuenta',
    other: 'Otro',
  },
  supportStatuses: {
    new: 'Nuevo',
    investigating: 'Investigando',
    waiting: 'En espera',
    done: 'Resuelto',
  },
  roles: {
    politics: 'Política',
    entertainment: 'Entretenimiento',
    sports: 'Deportes',
    business: 'Negocios',
    media: 'Medios',
    health: 'Salud',
    science: 'Ciencia',
  },
  votesLeft: 'votos restantes',
  nextVote: 'próximo voto',
  agree: 'Me gusta',
  disagree: 'No me gusta',
  breakdownLiking: 'A favor',
  breakdownDisliking: 'En contra',
  share: 'Compartir',
  linkCopied: 'Enlace copiado',
  userJoined: 'Se unió el {date}',
  userLikesCast: 'votos positivos',
  userDislikesCast: 'votos negativos',
  userVotesCast: 'Votos emitidos',
  userReportedProfiles: 'Opinio recientes',
  userNoProfiles: 'Sin opinio activos',
  userNotFoundLabel: 'No encontrado',
  userNotFoundTitle: 'Esta persona ha salido del edificio',
  userNotFoundBody: 'Esta cuenta ya no está aquí — puede que se haya tomado un descanso o que el enlace no sea del todo correcto.',
  userNotFoundCta: 'Volver al inicio',
  reportedBy: 'publicado por',
  justNow: 'justo ahora',
  justReported: 'Acaba de caer un opinio',
  delete: 'Eliminar',
  deleteProfile: 'Eliminar opinio',
  deleteProfileConfirm: '¿Eliminar este opinio permanentemente?',
  deleteProfileConfirmOneVote: '¿Eliminar este opinio y descartar 1 voto?',
  deleteProfileConfirmManyVotes: '¿Eliminar este opinio y descartar {count} votos?',
  deleting: 'Eliminando…',
  close: 'Cerrar',
};

export const LANGUAGES = {
  en: { label: '🇬🇧 English', strings: en },
  cs: { label: '🇨🇿 Čeština', strings: cs },
  es: { label: '🇪🇸 Español', strings: es },
} as const;

export type Locale = keyof typeof LANGUAGES;

export function getDefaultLocale(): Locale {
  const lang = navigator.language?.split('-')[0];
  if (lang && lang in LANGUAGES) return lang as Locale;
  return 'en';
}
