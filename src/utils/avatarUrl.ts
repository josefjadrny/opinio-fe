// Google sign-in stores the profile picture at 96px (`...=s96-c`). Its image
// server returns the same picture at any size when that suffix changes, so a
// place that shows the picture large asks for 256px - sharp on 2x screens and
// close on 3x. Not a documented Google API, but long stable; a URL in any
// other shape (our own uploads, a future provider) passes through untouched.
const GOOGLE_SIZE = /=s\d+(-c)?$/;

export function googleAvatarAtSize(url: string | null, size: number): string | null {
  if (!url || !url.includes('googleusercontent.com') || !GOOGLE_SIZE.test(url)) return url;
  return url.replace(GOOGLE_SIZE, `=s${size}-c`);
}
