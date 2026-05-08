type SignInIconProps = { className?: string };

export function SignInIcon({ className = 'w-4 h-4' }: SignInIconProps) {
  return (
    <svg className={`${className} shrink-0`} fill="none" viewBox="0 0 24 24" strokeWidth={2}>
      <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" d="M17.5 18.5A7.5 7.5 0 0012 15.75a7.5 7.5 0 00-5.5 2.75" />
      <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
