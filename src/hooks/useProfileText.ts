import { useState } from 'react';
import type { Profile } from '../types/profile';
import { useI18n } from '../i18n/I18nContext';

// Picks the text to show for a profile and exposes a "see original" toggle.
//
// The API already returns translated name/description in profile.name /
// profile.description for the active UI language (falling back to the original
// server-side when no translation exists). So a translation was actually
// applied iff the shown text differs from originalName/originalDescription.
// When it wasn't, hasTranslation is false and there's nothing to toggle.
export function useProfileText(profile: Profile | null | undefined) {
  const { locale } = useI18n();
  const [showOriginal, setShowOriginal] = useState(false);

  const hasTranslation =
    profile != null &&
    profile.originalName != null &&
    profile.sourceLang != null &&
    profile.sourceLang !== locale &&
    (profile.name !== profile.originalName ||
      profile.description !== profile.originalDescription);

  const showingOriginal = showOriginal && hasTranslation;

  return {
    name: profile ? (showingOriginal ? profile.originalName! : profile.name) : '',
    description: profile
      ? (showingOriginal ? profile.originalDescription ?? profile.description : profile.description)
      : '',
    hasTranslation,
    showingOriginal,
    toggle: () => setShowOriginal((v) => !v),
  };
}
