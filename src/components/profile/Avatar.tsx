import { useEffect, useState } from 'react';

interface AvatarProps {
  name: string;
  imageUrl: string | null;
  className?: string;
  isAnonymous?: boolean;
}

const COLORS = [
  '#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab',
  '#1e88e5', '#039be5', '#00897b', '#43a047', '#f4511e',
  '#fb8c00', '#fdd835', '#00acc1', '#6d4c41', '#546e7a',
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ name, imageUrl, className = '', isAnonymous = false }: AvatarProps) {
  const [errored, setErrored] = useState(false);

  // Reset the error flag whenever the source changes so a new URL gets a fresh chance.
  useEffect(() => { setErrored(false); }, [imageUrl]);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const color = colorFromName(name);

  if (!imageUrl || errored) {
    if (isAnonymous && !imageUrl) {
      return (
        <img
          src="/icons/anonymous-mask.png"
          alt="anonymous"
          className={`rounded-full object-cover shrink-0 ${className}`}
          style={{ background: '#718096', padding: '2px' }}
        />
      );
    }

    return (
      <div
        className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
        style={{ background: color }}
      >
        <span className="text-white font-semibold text-xs">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className={`rounded-full object-cover shrink-0 ${className}`}
      onError={() => setErrored(true)}
    />
  );
}
