import { useRef, useState } from 'react';

export function useBillingRedirect(fetchUrl: () => Promise<{ url: string }>) {
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const handleClick = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const { url } = await fetchUrl();
      window.location.href = url;
      // keep loading=true; we're leaving the page
    } catch {
      // re-enable after a short cooldown so users don't hammer it
      setTimeout(() => {
        inFlight.current = false;
        setLoading(false);
      }, 2000);
    }
  };
  return { loading, handleClick };
}
