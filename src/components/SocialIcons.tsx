import type { SVGProps } from 'react';

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.7 21v-7.6h2.55l.38-2.96H13.7V8.55c0-.86.24-1.44 1.47-1.44h1.57V4.47c-.27-.04-1.2-.12-2.29-.12-2.26 0-3.81 1.38-3.81 3.92v2.17H8.08v2.96h2.56V21h3.06Z" />
    </svg>
  );
}
