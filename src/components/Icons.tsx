import React from 'react';

type IconProps = { className?: string; size?: number };

const wrap = (children: React.ReactNode, className = 'h-5 w-5', size = 20) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const CartIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </>,
    className,
    size
  );

export const HeartIcon = ({ className, size }: IconProps) =>
  wrap(
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />,
    className,
    size
  );

export const UserIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>,
    className,
    size
  );

export const SearchIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>,
    className,
    size
  );

export const StarIcon = ({ className, size }: IconProps & { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size ?? 20}
    height={size ?? 20}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    className={className ?? 'h-5 w-5'}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const PlusIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>,
    className,
    size
  );

export const MinusIcon = ({ className, size }: IconProps) =>
  wrap(<path d="M5 12h14" />, className, size);

export const TrashIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>,
    className,
    size
  );

export const CheckIcon = ({ className, size }: IconProps) =>
  wrap(<path d="M20 6 9 17l-5-5" />, className, size);

export const TruckIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>,
    className,
    size
  );

export const ShieldIcon = ({ className, size }: IconProps) =>
  wrap(<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />, className, size);

export const ArrowLeftIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>,
    className,
    size
  );

export const StoreIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2a2.83 2.83 0 0 1-1.17-.27A3 3 0 0 1 16 12a3 3 0 0 1-3-3a3 3 0 0 1-3 3a3 3 0 0 1-2.83-.27A2.83 2.83 0 0 1 6 12a2 2 0 0 1-2-2a2 2 0 0 1-2-2V7Z" />
    </>,
    className,
    size
  );

export const FilterIcon = ({ className, size }: IconProps) =>
  wrap(<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />, className, size);

export const PackageIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>,
    className,
    size
  );

export const ZapIcon = ({ className, size }: IconProps) =>
  wrap(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />, className, size);

export const TagIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </>,
    className,
    size
  );

export const MenuIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </>,
    className,
    size
  );

export const XIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>,
    className,
    size
  );

export const ClockIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>,
    className,
    size
  );

export const CreditCardIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </>,
    className,
    size
  );

export const MapPinIcon = ({ className, size }: IconProps) =>
  wrap(
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>,
    className,
    size
  );
