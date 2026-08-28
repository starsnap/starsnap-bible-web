import React from 'react'
import { NavLink } from 'react-router-dom'
import { HomeIcon, PlusIcon, SearchIcon, StarIcon, UserIcon } from '../icons'

const items = [
    { key: 'home', path: '/', label: '홈', icon: HomeIcon },
    { key: 'search', path: '/search', label: '탐색', icon: SearchIcon },
    { key: 'add', path: '/add', label: '업로드', icon: PlusIcon, primary: true },
    { key: 'star', path: '/star', label: '스타', icon: StarIcon },
    { key: 'profile', path: '/profile', label: '프로필', icon: UserIcon },
]

const BottomNav: React.FC = () => {
    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[var(--ss-nav-bg)] shadow-[0_-8px_28px_rgb(23_27_36_/_0.08)] backdrop-blur-xl lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            aria-label="주요 메뉴"
        >
            <div className="mx-auto grid h-20 max-w-lg grid-cols-5 items-center px-2">
                {items.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.key}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `relative mx-auto flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold ${
                                item.primary || isActive
                                    ? 'text-ink'
                                    : 'text-muted hover:bg-placeholder hover:text-sub'
                            }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={item.primary ? 'flex h-9 w-12 items-center justify-center rounded-2xl bg-brand text-on-brand shadow-sm' : undefined}>
                                        <Icon size={item.primary ? 22 : 21} fill={isActive && !item.primary ? 'currentColor' : 'none'} />
                                    </span>
                                    <span>{item.label}</span>
                                    {isActive && !item.primary && <span className="absolute top-1.5 h-1 w-1 rounded-full bg-brand" aria-hidden="true" />}
                                </>
                            )}
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}

export default BottomNav
