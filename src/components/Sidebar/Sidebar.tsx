import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    HomeIcon,
    CompassIcon,
    MessageIcon,
    StarIcon,
    UsersIcon,
    BookmarkIcon,
    PlusSquareIcon,
    SettingsIcon,
    UserIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '../icons'
import { followedStars } from '../../constant/mock/snaps'
import { toStarRouteKey } from '../../services/snapService'

export type SidebarMode = 'full' | 'compact'

type SidebarProps = {
    mode: SidebarMode
    onToggleCompact: () => void
}

type NavItem = {
    path: string
    label: string
    icon: React.FC<{ size?: number; className?: string }>
    exact?: boolean
}

const items: NavItem[] = [
    { path: '/', label: '홈', icon: HomeIcon, exact: true },
    { path: '/search', label: '탐색', icon: CompassIcon },
    { path: '/message', label: '메시지', icon: MessageIcon },
    { path: '/star', label: '스타', icon: StarIcon },
    { path: '/stargroup', label: '스타그룹', icon: UsersIcon },
    { path: '/saved', label: '저장됨', icon: BookmarkIcon },
    { path: '/add', label: '업로드', icon: PlusSquareIcon },
    { path: '/setting', label: '설정', icon: SettingsIcon },
    { path: '/profile', label: '프로필', icon: UserIcon },
]

const Sidebar: React.FC<SidebarProps> = ({ mode, onToggleCompact }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const compact = mode === 'compact'
    const sourcePage = (location.state as { sourcePage?: string } | null)?.sourcePage
    const isProfileOriginSnapDetail =
        location.pathname.startsWith('/snap/') && sourcePage === 'profile'

    return (
        <aside
            className={`fixed left-0 top-16 bottom-0 bg-panel border-r border-line overflow-y-auto transition-[width] duration-200 ${
                compact ? 'w-20' : 'w-60'
            }`}
        >
            <div className={`pt-3 ${compact ? 'px-2' : 'px-3'} pb-2 border-b border-line/70`}>
                <div className={`flex ${compact ? 'flex-col items-center gap-2' : 'items-center justify-end gap-2'}`}>
                    <button
                        onClick={onToggleCompact}
                        className="h-11 w-11 rounded-xl border border-line text-sub hover:text-ink hover:border-ink flex items-center justify-center"
                        aria-label={compact ? '사이드바 펼치기' : '사이드바 축소'}
                        title={compact ? '펼치기' : '축소'}
                    >
                        {compact ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
                    </button>
                </div>
            </div>

            <nav className={`py-5 flex flex-col gap-1 ${compact ? 'px-2' : 'px-3'}`}>
                {items.map((item) => {
                    const activeByPath = item.exact
                        ? location.pathname === item.path
                        : location.pathname === item.path ||
                          location.pathname.startsWith(item.path + '/')
                    const active =
                        item.path === '/profile'
                            ? activeByPath || isProfileOriginSnapDetail
                            : activeByPath
                    const Icon = item.icon
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`relative w-full h-11 flex items-center rounded-xl transition-colors ${
                                compact ? 'justify-center' : 'gap-3 pl-4'
                            } ${
                                active
                                    ? 'bg-surface text-ink font-bold'
                                    : 'text-sub hover:bg-surface/70'
                            }`}
                            title={compact ? item.label : undefined}
                        >
                            {active && !compact && (
                                <span className="absolute left-0 top-0 h-11 w-1 rounded-sm bg-brand" />
                            )}
                            <Icon size={20} className={active ? 'text-ink' : 'text-sub'} />
                            {!compact && <span className="text-body-sm">{item.label}</span>}
                        </button>
                    )
                })}
            </nav>

            {!compact && (
                <div className="px-5 pt-3 pb-6">
                    <p className="text-xs text-muted mb-3">팔로우한 스타</p>
                    <ul className="flex flex-col gap-3">
                        {followedStars.map((star) => (
                            <li key={star.id}>
                                <button
                                    onClick={() =>
                                        navigate(`/star/${toStarRouteKey({ name: star.name })}`)
                                    }
                                    className="flex min-h-11 items-center gap-2.5 rounded-lg text-sub hover:text-ink transition-colors"
                                >
                                    <span className="w-7 h-7 rounded-full bg-placeholder" />
                                    <span className="text-sm">{star.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </aside>
    )
}

export default Sidebar
