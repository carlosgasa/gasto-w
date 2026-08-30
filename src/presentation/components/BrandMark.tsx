interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 40 }: BrandMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <radialGradient id="brandBg" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#B33BF2" />
          <stop offset="55%" stopColor="#9B24DE" />
          <stop offset="100%" stopColor="#5B1594" />
        </radialGradient>
        <linearGradient id="brandCoin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEBAE" />
          <stop offset="55%" stopColor="#F6C74B" />
          <stop offset="100%" stopColor="#D69A1F" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="116" fill="url(#brandBg)" />
      <g stroke="#8A5A12" strokeWidth={3.5}>
        <circle cx="152" cy="96" r="22" fill="url(#brandCoin)" />
        <circle cx="173" cy="71" r="20" fill="url(#brandCoin)" />
        <circle cx="187" cy="46" r="18" fill="url(#brandCoin)" />
      </g>
      <g transform="rotate(-9 122 152)">
        <rect x="48" y="115" width="150" height="102" rx="20" fill="#F7E1F1" stroke="#3B1D5E" strokeWidth={5.5} />
        <path d="M48 149 H198" stroke="#3B1D5E" strokeWidth={3} opacity={0.3} />
        <circle cx="169" cy="174" r="14" fill="url(#brandCoin)" stroke="#8A5A12" strokeWidth={2.5} />
        <text
          x="98"
          y="205"
          textAnchor="middle"
          fontFamily="'Arial Rounded MT Bold','Segoe UI','Arial Black',Arial,sans-serif"
          fontWeight={900}
          fontSize={88}
          fill="#3B1D5E"
        >
          $
        </text>
      </g>
    </svg>
  );
}
