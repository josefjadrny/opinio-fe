// An answer's mark: its round picture with a ring in the answer's colour, or,
// with no picture, the colour itself. Round on purpose - the poll's own
// picture is the rounded square; an answer is a choice inside it.
export function OptionAvatar({ color, imageUrl, className }: { color: string; imageUrl: string | null; className: string }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className={`rounded-full object-cover shrink-0 bg-white/5 ${className}`}
        style={{ boxShadow: `0 0 0 2px ${color}` }}
      />
    );
  }
  // Same footprint as a picture, so the answers' text lines up in a poll
  // where only some answers have one.
  return (
    <span aria-hidden className={`rounded-full shrink-0 flex items-center justify-center ${className}`} style={{ boxShadow: `inset 0 0 0 2px ${color}` }}>
      <span className="w-1/3 h-1/3 rounded-full" style={{ background: color }} />
    </span>
  );
}

// An answer's mark in small lists (tooltips, previews): its round picture
// when it has one, else a plain dot in its colour - centred in the same box
// so text lines up either way.
export function OptionMark({ color, imageUrl, className }: { color: string; imageUrl: string | null; className: string }) {
  if (imageUrl) return <OptionAvatar color={color} imageUrl={imageUrl} className={className} />;
  return (
    <span aria-hidden className={`shrink-0 flex items-center justify-center ${className}`}>
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    </span>
  );
}
