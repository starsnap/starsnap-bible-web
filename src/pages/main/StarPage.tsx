import React, { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    searchStarGroups,
    searchStars,
    toStarRouteKey,
    type StarGroupSearchItem,
    type StarSearchItem,
} from '../../services/snapService'
import { applyNextImageCandidate, getImageCandidates } from '../../utils/s3Image'
import { queryKeys } from '../../services/queryKeys'
import { SearchIcon } from '../../components/icons'
import { StarGroupListSkeleton, StarListSkeleton } from '../../components/ui/EntitySkeletons'

type StarTab = 'star' | 'group'

const StarPage: React.FC = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<StarTab>('star')
    const [query, setQuery] = useState('')
    const deferredQuery = useDeferredValue(query.trim())

    const starsQuery = useQuery({
        queryKey: queryKeys.stars(deferredQuery, 0, 48),
        queryFn: () => searchStars(deferredQuery, 0, 48),
        enabled: activeTab === 'star',
    })
    const groupsQuery = useQuery({
        queryKey: queryKeys.starGroups(deferredQuery, 0, 48),
        queryFn: () => searchStarGroups(deferredQuery, 0, 48),
        enabled: activeTab === 'group',
    })

    const stars: StarSearchItem[] = starsQuery.data ?? []
    const groups: StarGroupSearchItem[] = groupsQuery.data ?? []

    return (
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="relative">
                <SearchIcon
                    size={22}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-transparent bg-placeholder pl-12 pr-4 text-base text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/25"
                    placeholder={activeTab === 'star' ? 'Star 검색' : 'StarGroup 검색'}
                    aria-label={activeTab === 'star' ? 'Star 검색' : 'StarGroup 검색'}
                />
            </div>

            <div className="mt-4 grid grid-cols-2" role="tablist" aria-label="스타 유형">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'star'}
                    onClick={() => {
                        setActiveTab('star')
                        setQuery('')
                    }}
                    className={`min-h-12 rounded-xl text-lg font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                        activeTab === 'star' ? 'text-ink' : 'text-muted hover:text-sub'
                    }`}
                >
                    Star
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'group'}
                    onClick={() => {
                        setActiveTab('group')
                        setQuery('')
                    }}
                    className={`min-h-12 rounded-xl text-lg font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                        activeTab === 'group' ? 'text-ink' : 'text-muted hover:text-sub'
                    }`}
                >
                    StarGroup
                </button>
            </div>

            <div className="mt-5">
                {activeTab === 'star' ? (
                    starsQuery.isLoading ? (
                        <StarListSkeleton />
                    ) : starsQuery.isError ? (
                        <StateMessage message="스타를 불러오지 못했어요." onRetry={() => void starsQuery.refetch()} />
                    ) : stars.length === 0 ? (
                        <StateMessage message="검색 결과가 없어요." />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            {stars.map((star) => {
                                const imageCandidates = getImageCandidates(star.imageKey)

                                return (
                                    <button
                                        key={`${star.id || 'name'}-${star.name}-${star.nickname || ''}`}
                                        onClick={() => navigate(`/star/${toStarRouteKey(star)}`)}
                                        className="min-h-32 rounded-2xl border border-line bg-panel p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                    >
                                        <div className="flex items-center gap-4">
                                            {imageCandidates.length > 0 ? (
                                                <img
                                                    src={imageCandidates[0]}
                                                    alt={`${star.name} 프로필`}
                                                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                                                    onError={(event) =>
                                                        applyNextImageCandidate(event.currentTarget, imageCandidates)
                                                    }
                                                />
                                            ) : (
                                                <span className="h-14 w-14 shrink-0 rounded-full bg-placeholder" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-lg font-bold text-ink">{star.name}</p>
                                                <p className="truncate text-sm text-sub">
                                                    {star.starGroup?.name || '-'} · {star.nickname || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {star.birthday ? (
                                            <p className="mt-4 text-xs text-sub">생일 {star.birthday}</p>
                                        ) : null}
                                    </button>
                                )
                            })}
                        </div>
                    )
                ) : groupsQuery.isLoading ? (
                    <StarGroupListSkeleton />
                ) : groupsQuery.isError ? (
                    <StateMessage message="스타그룹을 불러오지 못했어요." onRetry={() => void groupsQuery.refetch()} />
                ) : groups.length === 0 ? (
                    <StateMessage message="검색 결과가 없어요." />
                ) : (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                        {groups.map((group) => {
                            const imageCandidates = getImageCandidates(group.imageKey)

                            return (
                                <button
                                    key={group.id}
                                    onClick={() => navigate(`/stargroup/${group.id}`)}
                                    className="group relative aspect-square overflow-hidden rounded-2xl bg-placeholder text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                >
                                    {imageCandidates.length > 0 ? (
                                        <img
                                            src={imageCandidates[0]}
                                            alt={`${group.name} 프로필`}
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                            onError={(event) =>
                                                applyNextImageCandidate(event.currentTarget, imageCandidates)
                                            }
                                        />
                                    ) : null}
                                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                                    <span className="absolute inset-x-0 bottom-0 p-4 text-on-media">
                                        <span className="block truncate text-lg font-bold">{group.name}</span>
                                        <span className="mt-1 block text-sm text-on-media/80">
                                            데뷔 {group.debutDate || '-'}
                                        </span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

const StateMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
    <div className="rounded-2xl border border-line bg-panel px-5 py-8 text-center">
        <p className="text-sm text-sub">{message}</p>
        {onRetry ? (
            <button
                type="button"
                onClick={onRetry}
                className="mt-4 min-h-11 rounded-xl border border-line px-5 text-sm font-bold text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
                다시 시도
            </button>
        ) : null}
    </div>
)

export default StarPage
