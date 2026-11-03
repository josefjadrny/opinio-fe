import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Once per visit, not every time the caption's rotation comes back to the mark.
let played = false;

// The clip starts once the caption's own entry animation has run.
const START_DELAY_MS = 600;

// The Opinio mark as a round disc, like the avatar and flag discs of the
// caption's other states, that plays a short clip once - the bubble turns into
// the globe and back. The clip opens and closes on the logo, so the video
// simply stays on its last frame afterwards, and a disc that does not play
// (reduced motion, a blocked autoplay, the rotation's later rounds) shows its
// first frame: the same logo either way. The disc's background is the clip's
// own backdrop colour, so it reads as one surface while the video loads, and
// the poster is that first frame (1.7 KB), so the logo is there before the
// clip has arrived.
//
// /video/* deploys with a 1-day cache (deploy.yml), not the year-long immutable
// one, so a re-cut clip can overwrite this file and reaches everyone within a
// day. Re-cut the poster with it, or the disc shows the old first frame:
// ffmpeg -i <clip> -frames:v 1 -c:v libwebp -quality 90 <clip>-poster.webp
export function LogoIntro({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (played || reducedMotion) return;
    const id = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      played = true;
      video.play().catch(() => {});
    }, START_DELAY_MS);
    return () => clearTimeout(id);
  }, [reducedMotion]);

  return (
    <span className={`block rounded-full overflow-hidden bg-[#141424] ring-2 ring-white/10 ${className ?? ''}`}>
      <video
        ref={videoRef}
        src="/video/logo-earth-v1.mp4"
        poster="/video/logo-earth-v1-poster.webp"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="block w-full h-full object-cover"
      />
    </span>
  );
}
