import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addNewProfile } from '../../api/client';
import { ALL_COUNTRIES, getCountryFlag } from '../../utils/countries';
import { ALL_ROLES, ROLE_COLORS } from '../../utils/roles';
import { useI18n } from '../../i18n/I18nContext';
import { useMe } from '../../hooks/useMe';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Role } from '../../types/profile';

interface AddProfileModalProps {
  onClose: () => void;
}

export function AddProfileModal({ onClose }: AddProfileModalProps) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { data: me } = useMe();
  const isMobile = useIsMobile();

  const user = me?.user;

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('politician');
  const [countryCode, setCountryCode] = useState(() => {
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1]?.toUpperCase();
    if (region && ALL_COUNTRIES.some((c) => c.code === region)) return region;
    return 'US';
  });
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Set country from user's profile once on mount
  const countryInitialized = useRef(false);
  useEffect(() => {
    if (!countryInitialized.current && user?.countryCode) {
      if (ALL_COUNTRIES.some((c) => c.code === user.countryCode)) {
        setCountryCode(user.countryCode!);
      }
      countryInitialized.current = true;
    }
  }, [user?.countryCode]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: addNewProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    mutation.mutate({
      name: name.trim(),
      role,
      countryCode,
      description: description.trim(),
      imageUrl: imageUrl.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=random`,
      addedBy: user?.displayName ?? 'Anonymous',
    });
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">{t.nameLabel}</label>
        <input
          type="text"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">{t.roleLabel}</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`${ROLE_COLORS[r]} text-white text-[11px] leading-none font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-all ${
                role === r ? 'opacity-100 ring-2 ring-white/40' : 'opacity-35 hover:opacity-65'
              }`}
            >
              {t.roles[r]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">{t.country}</label>
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="w-full text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          {ALL_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} style={{ backgroundColor: '#1a1a2e', color: 'white' }}>
              {getCountryFlag(c.code)} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">{t.descriptionLabel}</label>
        <textarea
          placeholder={t.descriptionPlaceholder}
          value={description}
          maxLength={255}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent resize-none"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">{t.photoLabel}</label>
        <input
          type="url"
          placeholder={t.imageUrlPlaceholder}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-accent text-white text-sm font-medium py-2 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
      >
        {mutation.isPending ? t.adding : t.addProfile}
      </button>
    </form>
  );

  const closeButton = (
    <button type="button" onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-surface border-t border-border rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-6 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-white">{t.addProfileTitle}</h2>
            {closeButton}
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-white">{t.addProfileTitle}</h2>
          {closeButton}
        </div>
        {formContent}
      </div>
    </div>
  );
}
