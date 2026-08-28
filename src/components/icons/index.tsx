import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number }

const base = (size?: number): React.SVGProps<SVGSVGElement> => ({
    width: size ?? 20,
    height: size ?? 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false',
})

export const StarIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
)

export const HomeIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
)

export const CompassIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <circle cx="12" cy="12" r="9" />
        <polygon points="16.5 7.5 13.5 13.5 7.5 16.5 10.5 10.5 16.5 7.5" />
    </svg>
)

export const MessageIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.9-5.7A8.38 8.38 0 0 1 3.5 11 8.5 8.5 0 0 1 12 3a8.38 8.38 0 0 1 9 8.5z" />
    </svg>
)

export const UsersIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)

export const BookmarkIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
)

export const PlusSquareIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
)

export const SettingsIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)

export const UserIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
)

export const SearchIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
)

export const BellIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
)

export const PlusIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
)

export const HeartIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
)

export const ShareIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
)

export const MoreIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
    </svg>
)

export const LinkIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
)

export const CalendarIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
)

export const SendIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
)

export const ImageIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
    </svg>
)

export const ChevronLeftIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <polyline points="15 18 9 12 15 6" />
    </svg>
)

export const ChevronRightIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <polyline points="9 18 15 12 9 6" />
    </svg>
)

export const ChevronDownIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
)

export const CheckIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

export const CloseIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

export const EditIcon: React.FC<IconProps> = ({ size, ...p }) => (
    <svg {...base(size)} {...p}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
)
