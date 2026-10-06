// The app's ▲ / ▼ vote markers side by side in the brand green/red: "votes,
// both sides". Stats uses it for the net metric, the user activity list for a
// vote row (which never says which side - the API does not send it).
export function VotePairIcon({ className = 'text-xs' }: { className?: string }) {
  return (
    <span aria-hidden className={`leading-none tracking-[-0.25em] ${className}`}>
      <span className="text-positive">▲</span>
      <span className="text-negative">▼</span>
    </span>
  );
}
