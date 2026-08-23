import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { StarIcon, SearchIcon, PlusIcon, BellIcon } from '../icons'
import { getMyProfile, type UserProfileResponse } from '../../services/snapService'
import { queryKeys } from '../../services/queryKeys'
import { applyNextImageCandidate, getImageCandidates } from '../../utils/s3Image'

const resolveProfileImageKey = (profile: UserProfileResponse | null): string | null => {
    if (!profile) return null
    const savedKey = profile.profileImageUrl?.trim()
    return savedKey || null
}

const AppHeader: React.FC = () => {
    const navigate = useNavigate()
    const profileQuery = useQuery<UserProfileResponse>({
        queryKey: queryKeys.myProfile,
        queryFn: getMyProfile,
    })

    const profileImageCandidates = getImageCandidates(resolveProfileImageKey(profileQuery.data ?? null))

    return (
        <header className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-line bg-[var(--ss-header-bg)] text-ink shadow-[var(--ss-shadow-sm)] backdrop-blur-xl">
            <div className="h-full flex items-center px-4 sm:px-6 lg:px-7 gap-2 sm:gap-4 lg:gap-6">
                <button
                    onClick={() => navigate('/')}
                    className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-1.5 shrink-0 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label="StarSnap home"
                >
                    <StarIcon size={24} className="text-brand" fill="currentColor" stroke="none" />
                    <span className="hidden text-xl font-semibold tracking-tight lg:inline">StarSnap</span>
                </button>

                <div className="hidden flex-1 justify-center lg:flex">
                    <div className="relative w-full max-w-[520px]">
                        <SearchIcon
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        />
                        <input
                            className="h-11 w-full rounded-full border border-transparent bg-placeholder pl-11 pr-4 text-sm text-ink placeholder:text-muted hover:border-line focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                            placeholder="스타, 유저, 스냅 검색"
                            aria-label="스타, 유저, 스냅 검색"
                            readOnly
                            onFocus={() => navigate('/search')}
                        />
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/add')}
                        className="hidden min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-bold text-on-brand shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:flex"
                        aria-label="스냅 업로드"
                    >
                        <PlusIcon size={18} />
                        <span className="hidden lg:inline">업로드</span>
                    </button>
                    <button className="flex h-11 w-11 items-center justify-center rounded-full text-sub hover:bg-placeholder hover:text-ink" aria-label="알림">
                        <BellIcon size={22} />
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-placeholder"
                        aria-label="프로필"
                    >
                        <span className="h-8 w-8 overflow-hidden rounded-full bg-placeholder ring-1 ring-line">
                            {profileImageCandidates.length > 0 ? (
                            <img
                                src={profileImageCandidates[0]}
                                alt="내 프로필"
                                className="w-full h-full object-cover"
                                onError={(e) => applyNextImageCandidate(e.currentTarget, profileImageCandidates)}
                            />
                            ) : null}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    )
}

export default AppHeader
