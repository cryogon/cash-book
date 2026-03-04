import type { CSSProperties } from 'react';

export function BookIcon({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Back pages */}
      <rect x="18" y="28" width="72" height="110" rx="4" fill="#b8cce4" stroke="#4a7ab5" strokeWidth="2.5" transform="rotate(-8 54 83)" />
      <rect x="110" y="28" width="72" height="110" rx="4" fill="#b8cce4" stroke="#4a7ab5" strokeWidth="2.5" transform="rotate(8 146 83)" />

      {/* Main left page */}
      <path d="M30 30 Q100 10 100 145 L30 145 Z" fill="#dce9f5" stroke="#3a6fa5" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Main right page */}
      <path d="M170 30 Q100 10 100 145 L170 145 Z" fill="#dce9f5" stroke="#3a6fa5" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Spine bottom */}
      <ellipse cx="100" cy="148" rx="12" ry="6" fill="#4a7ab5" />

      {/* Page lines left */}
      <line x1="55" y1="65" x2="94" y2="62" stroke="#4a7ab5" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="52" y1="80" x2="93" y2="78" stroke="#4a7ab5" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="50" y1="95" x2="92" y2="94" stroke="#4a7ab5" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

      {/* Page lines right */}
      <line x1="106" y1="62" x2="145" y2="65" stroke="#4a7ab5" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="107" y1="78" x2="148" y2="80" stroke="#4a7ab5" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="108" y1="94" x2="150" y2="95" stroke="#4a7ab5" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
