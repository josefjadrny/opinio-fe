import type { ReactNode } from 'react';

interface BulletItemProps {
  children: ReactNode;
}

export function BulletItem({ children }: BulletItemProps) {
  return (
    <li className="flex gap-2">
      <span className="text-positive shrink-0 text-[10px] leading-relaxed">▶</span>
      <span>{children}</span>
    </li>
  );
}
