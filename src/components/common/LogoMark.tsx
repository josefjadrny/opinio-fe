// The Opinio mark, the same artwork as the store icon on Play:
// /icons/logo-mark.png is rendered from the store icon's own generator
// (opinio-android/play-assets/gen-logo-mark.py) with the background left out,
// cropped to the bubble. Not /favicon.svg - every logo asset we ship bakes in
// an opaque background, which on a lighter surface reads as a dark tile
// around the logo.
//
// A PNG rather than an inline SVG redraw: the store icon paints each gradient
// across the whole canvas and masks the shapes out of it, so the bubble and
// its tail share one gradient. An SVG gradient sizes to each shape's own box,
// which started the tail light against the bubble's dark bottom - a visible
// seam where they meet. 192px wide covers the 52px map caption at 3x.
//
// /icons/* deploys with a year-long immutable cache, so a regenerated mark
// needs a new filename, not an overwrite.
export function LogoMark({ className }: { className?: string }) {
  return <img src="/icons/logo-mark.png" alt="" aria-hidden="true" draggable={false} className={`object-contain ${className ?? ''}`} />;
}
