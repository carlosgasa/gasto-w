import type { ReactElement, SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "expenses"
  | "accounts"
  | "categories"
  | "recurring"
  | "reports"
  | "settings"
  | "logout"
  | "add"
  | "sun"
  | "moon"
  | "violet"
  | "food"
  | "transport"
  | "fuel"
  | "entertainment"
  | "health"
  | "services"
  | "home"
  | "clothing"
  | "education"
  | "other"
  | "card"
  | "cash"
  | "construction"
  | "furniture"
  | "delivery"
  | "school"
  | "business"
  | "loans"
  | "pets"
  | "gifts"
  | "travel";

const paths: Record<IconName, ReactElement> = {
  dashboard: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h5v-5h2v5h5v-9" />
    </>
  ),
  expenses: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </>
  ),
  accounts: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14.2" r="1.4" />
    </>
  ),
  categories: (
    <>
      <path d="M20 12 12 20l-8-8V4h8l8 8z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  recurring: (
    <>
      <path d="M4 12a8 8 0 0 1 14-5.3L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-14 5.3L4 16" />
      <path d="M4 20v-4h4" />
    </>
  ),
  reports: (
    <>
      <line x1="5" y1="20" x2="19" y2="20" />
      <rect x="6" y="12" width="3" height="8" />
      <rect x="11" y="7" width="3" height="13" />
      <rect x="16" y="10" width="3" height="10" />
    </>
  ),
  settings: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <circle cx="9" cy="7" r="2" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <circle cx="16" cy="14" r="2" />
      <line x1="4" y1="21" x2="20" y2="21" />
      <circle cx="10" cy="21" r="2" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  add: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4" y1="12" x2="2" y2="12" />
      <line x1="22" y1="12" x2="20" y2="12" />
      <line x1="4.9" y1="4.9" x2="6.3" y2="6.3" />
      <line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="6.3" y2="17.7" />
      <line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />,
  violet: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M9.5 10a2 2 0 0 1 2-1.5h1a2 2 0 0 1 0 4h-1a2 2 0 0 0 0 4h1a2 2 0 0 0 2-1.5" />
    </>
  ),
  food: (
    <>
      <path d="M6 3v7a2 2 0 0 0 4 0V3" />
      <line x1="8" y1="3" x2="8" y2="21" />
      <path d="M17 3c-1.5 0-3 1.5-3 4s1.5 4 3 4v10" />
    </>
  ),
  transport: (
    <>
      <path d="M4 16V9l2-4h12l2 4v7" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
  fuel: <path d="M12 3c3 4 5 6.5 5 9.5a5 5 0 0 1-10 0C7 9.5 9 7 12 3z" />,
  entertainment: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V8z" />
      <line x1="10" y1="6" x2="10" y2="18" strokeDasharray="2 3" />
    </>
  ),
  health: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  services: <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z" />,
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
      <rect x="10" y="14" width="4" height="5" />
    </>
  ),
  clothing: <path d="M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3-2 2h-4l-2-2z" />,
  education: (
    <>
      <path d="M12 4 2 9l10 5 10-5-10-5z" />
      <path d="M6 11.5V16c0 1.5 2.5 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  other: (
    <>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </>
  ),
  cash: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  construction: (
    <>
      <path d="M4 16a8 8 0 0 1 16 0" />
      <rect x="3" y="16" width="18" height="3" rx="1" />
      <line x1="12" y1="8" x2="12" y2="4" />
    </>
  ),
  furniture: (
    <>
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <rect x="4" y="11" width="16" height="6" rx="1.5" />
      <line x1="5" y1="17" x2="5" y2="20" />
      <line x1="19" y1="17" x2="19" y2="20" />
    </>
  ),
  delivery: (
    <>
      <path d="M6 8h12l-1.2 12H7.2z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  school: (
    <>
      <path d="M4 21V10l8-5 8 5v11" />
      <rect x="10.5" y="15" width="3" height="6" />
      <rect x="6.3" y="12.2" width="2.4" height="2.4" />
      <rect x="15.3" y="12.2" width="2.4" height="2.4" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </>
  ),
  business: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="3" y1="13" x2="21" y2="13" />
    </>
  ),
  loans: (
    <>
      <circle cx="7" cy="7" r="2.3" />
      <circle cx="17" cy="17" r="2.3" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </>
  ),
  pets: (
    <>
      <circle cx="12" cy="15.5" r="3.3" />
      <circle cx="6" cy="9" r="1.7" />
      <circle cx="10" cy="5.5" r="1.7" />
      <circle cx="14" cy="5.5" r="1.7" />
      <circle cx="18" cy="9" r="1.7" />
    </>
  ),
  gifts: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <line x1="4" y1="13.5" x2="20" y2="13.5" />
      <line x1="12" y1="9" x2="12" y2="20" />
      <path d="M12 9c-3 0-4-2.6-2.7-3.8C10.5 4 12 6 12 9z" />
      <path d="M12 9c3 0 4-2.6 2.7-3.8C13.5 4 12 6 12 9z" />
    </>
  ),
  travel: <path d="M3 12 21 4l-6 17-4-7-7-3z" />,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
