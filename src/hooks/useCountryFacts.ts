import { useQuery } from '@tanstack/react-query';

export interface CountryFactsLeader {
  role: 'state' | 'government' | 'both' | 'vp';
  name: string;
  since?: string;
  title: Record<string, string>;
  acting?: boolean;
  inCharge?: boolean;
  photo?: { url: string; credit: string; license: string; source: string };
}

export interface CountryFacts {
  population?: number;
  populationYear?: number;
  capital?: { name: string; names?: Record<string, string>; population?: number };
  leaders?: CountryFactsLeader[];
}

interface CountryFactsFile {
  updatedAt: string;
  countries: Record<string, CountryFacts>;
}

// One static file for every country (population, capital, who is in office),
// refreshed daily outside the build and served from the site's own origin
// under /data - dev proxies it to the live copy. Fetched once and shared by
// every country window; a failed fetch just leaves the block out.
export function useCountryFacts(code: string | null) {
  const query = useQuery({
    queryKey: ['countryFacts'],
    queryFn: async (): Promise<CountryFactsFile> => {
      const res = await fetch('/data/country-facts.json');
      if (!res.ok) throw new Error(`country facts ${res.status}`);
      return res.json();
    },
    staleTime: 60 * 60_000,
    retry: 1,
  });
  return {
    facts: code ? query.data?.countries[code] : undefined,
    updatedAt: query.data?.updatedAt,
  };
}
