import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addNewProfile } from '../../api/client';
import { ALL_COUNTRIES } from '../../utils/countries';
import { ALL_ROLES, ROLE_LABELS } from '../../utils/roles';
import type { Role } from '../../types/profile';

interface AddProfileModalProps {
  onClose: () => void;
}

export function AddProfileModal({ onClose }: AddProfileModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('politician');
  const [countryCode, setCountryCode] = useState('US');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [addedBy, setAddedBy] = useState('');

  const mutation = useMutation({
    mutationFn: addNewProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !addedBy.trim()) return;

    mutation.mutate({
      name: name.trim(),
      role,
      countryCode,
      description: description.trim(),
      imageUrl: imageUrl.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=random`,
      addedBy: addedBy.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-surface-light border border-border rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-4">Add a Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>

          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
          >
            {ALL_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          <textarea
            placeholder="Latest statement or opinion *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent resize-none"
            required
          />

          <input
            type="url"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
          />

          <input
            type="text"
            placeholder="Your name *"
            value={addedBy}
            onChange={(e) => setAddedBy(e.target.value)}
            className="w-full bg-surface text-white text-sm rounded-lg border border-border px-3 py-2 focus:outline-none focus:border-accent"
            required
          />

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 text-white text-sm font-medium py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-accent text-white text-sm font-medium py-2 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Adding...' : 'Add Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
