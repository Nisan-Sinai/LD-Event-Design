import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

type BrandIcon = ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

declare module 'lucide-react' {
  export const Facebook: BrandIcon;
  export const Instagram: BrandIcon;
}

declare module 'lucide-react/dist/esm/lucide-react.mjs' {
  export * from 'lucide-react';
}
