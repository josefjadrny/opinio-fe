import { forwardRef } from 'react';

interface HeaderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** `circle` is the round icon button the header's right edge uses (add
   *  opinio, profile) - a filled disc rather than the outlined chip, because at
   *  that size an outline alone reads as an empty hole. 40px on mobile, 44 from
   *  md up where there is room for it. `default` is the rounded-rect chip
   *  everything else keeps. */
  shape?: 'default' | 'circle';
}

export const HeaderButton = forwardRef<HTMLButtonElement, HeaderButtonProps>(
  ({ active, shape = 'default', className = '', ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      className={`border transition-colors ${
        shape === 'circle'
          ? `rounded-full w-10 h-10 md:w-11 md:h-11 flex items-center justify-center shrink-0 ${
              active ? 'border-white/40 bg-white/15' : 'border-white/15 bg-white/[0.07] hover:bg-white/[0.13] hover:border-white/30'
            }`
          : `rounded-lg ${
              active ? 'border-white/60 bg-white/5' : 'border-white/30 hover:border-white/60 hover:bg-white/5'
            }`
      } disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    />
  )
);

HeaderButton.displayName = 'HeaderButton';
