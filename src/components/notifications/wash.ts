import type { CSSProperties } from 'react';

// The brand's two sides as a soft wash behind the panel's header and empty
// state (index.css `.user-header-wash`, the /u/:id header's technique): red
// from the top-left, green from the bottom-right.
export const WASH = { '--wash-a': 'rgba(239,68,68,0.14)', '--wash-b': 'rgba(34,197,94,0.12)' } as CSSProperties;
