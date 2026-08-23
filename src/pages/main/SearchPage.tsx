import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SearchIcon } from '../../components/icons'
import CategoryChips from '../../components/ui/CategoryChips'
import MasonryGrid from '../../components/ui/MasonryGrid'
import { StarListSkeleton } from '../../components/ui/EntitySkeletons'
import { getPhotoAspectRatio, type Snap } from '../../constant/mock/snaps'
import {
    getFeedSnaps,
    getPopularSearchKeywords,
    getSnaps,
    searchStars,
    searchStarGroups,
    searchUsers,
    toStarRouteKey,
    type SnapFeedItem,
    type StarSearchItem,
    type StarGroupSearchItem,
    type UserSearchItem,
} from '../../services/snapService'
import { queryKeys } from '../../services/queryKeys'
import { applyNextImageCandidate, getImageCandidates } from '../../utils/s3Image'

const fallbackTrending: string[] = []

const toSnapCard = (item: SnapFeedItem, index: number): Snap => ({
    id: item.snapData.snapId,
    author: item.createdUser.username,
    authorImageKey: item.createdUser.imageKey ?? null,
    aspectRatio: getPhotoAspectRatio(item.snapData.photos?.[0], index),
    photoKey: item.snapData.photos?.[0]?.fileKey,
    liked: !!item.snapData.likeState,
})

const toSnapItemMap = (items: SnapFeedItem[]) =>
    Object.fromEntries(items.map((item) => [item.snapData.snapId, item]))

const EXPLORE_TABS = ['전체', '유저', '스타', '스타그룹', '스냅'] as const
type ExploreTab = (typeof EXPLORE_TABS)[number]

const PREVIEW_SIZE = 6
const FULL_SIZE = 48

const EmptyMessage: React.FC<{ text: string }> = ({ text }) => (
    <p className="text-sm text-sub">{text}</p>
)

const UserResultCard: React.FC<{ user: UserSearchItem; onClick: () => void }> = ({ user, onClick }) => {
    const imageCandidates = getImageCandidates(user.profileImageUrl)
    return (
        <button
            onClick={onClick}
            className="text-left rounded-2xl border border-line bg-panel p-5 hover:shadow-sm hover:-translate-y-0.5 transition"
        >
            <div className="flex items-center gap-4">
                {imageCandidates.length > 0 ? (
                    <img
                        src={imageCandidates[0]}
                        alt={`${user.username} 프로필`}
                        className="w-14 h-14 rounded-full object-cover shrink-0"
                        onError={(e) => applyNextImageCandidate(e.currentTarget, imageCandidates)}
                    />
                ) : (
                    <span className="w-14 h-14 rounded-full bg-placeholder shrink-0" />
                )}
                <p className="text-lg font-bold text-ink truncate">{user.username}</p>
            </div>
        </button>
    )
}

const StarResultCard: React.FC<{ star: StarSearchItem; onClick: () => void }> = ({ star, onClick }) => {
    const imageCandidates = getImageCandidates(star.imageKey)
    return (
        <button
            onClick={onClick}
            className="text-left rounded-2xl border border-line bg-panel p-5 hover:shadow-sm hover:-translate-y-0.5 transition"
        >
            <div className="flex items-center gap-4">
                {imageCandidates.length > 0 ? (
                    <img
                        src={imageCandidates[0]}
                        alt={`${star.name} 프로필`}
                        className="w-14 h-14 rounded-full object-cover shrink-0"
                        onError={(e) => applyNextImageCandidate(e.currentTarget, imageCandidates)}
                    />
                ) : (
                    <span className="w-14 h-14 rounded-full bg-placeholder shrink-0" />
                )}
                <div className="min-w-0">
                    <p className="text-lg font-bold text-ink truncate">{star.name}</p>
                    <p className="text-sm text-sub truncate">
                        {star.starGroup?.name || '-'} · {star.nickname || '-'}
                    </p>
                </div>
            </div>
        </button>
    )
}

const StarGroupResultCard: React.FC<{ group: StarGroupSearchItem; onClick: () => void }> = ({ group, onClick }) => {
    const imageCandidates = getImageCandidates(group.imageKey)
    return (
        <button
            onClick={onClick}
            className="text-left rounded-2xl border border-line bg-panel p-5 hover:shadow-sm hover:-translate-y-0.5 transition"
        >
            <div className="flex items-center gap-4">
                {imageCandidates.length > 0 ? (
                    <img
                        src={imageCandidates[0]}
                        alt={`${group.name} 이미지`}
                        className="w-14 h-14 rounded-full object-cover shrink-0"
                        onError={(e) => applyNextImageCandidate(e.currentTarget, imageCandidates)}
                    />
                ) : (
                    <span className="w-14 h-14 rounded-full bg-placeholder shrink-0" />
                )}
                <p className="text-lg font-bold text-ink truncate">{group.name}</p>
            </div>
        </button>
    )
}

const SearchPage: React.FC = () => {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [tab, setTab] = useState<ExploreTab>('전체')

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250)
        return () => clearTimeout(timer)
    }, [query])

    const isSearching = debouncedQuery.length > 0
    const previewEnabled = tab === '전체' && isSearching

    const popularKeywordsQuery = useQuery({
        queryKey: queryKeys.popularSearchKeywords(8),
        queryFn: () => getPopularSearchKeywords(8),
    })
    const feedQuery = useQuery({
        queryKey: queryKeys.feedSnaps(0, 24),
        queryFn: () => getFeedSnaps(0, 24),
        enabled: tab === '전체' && !isSearching,
    })

    // '전체' 탭에서 검색 중일 때 보여줄 유형별 미리보기
    const usersPreviewQuery = useQuery({
        queryKey: queryKeys.users(debouncedQuery, 0, PREVIEW_SIZE),
        queryFn: () => searchUsers(debouncedQuery, 0, PREVIEW_SIZE),
        enabled: previewEnabled,
    })
    const starsPreviewQuery = useQuery({
        queryKey: queryKeys.stars(debouncedQuery, 0, PREVIEW_SIZE),
        queryFn: () => searchStars(debouncedQuery, 0, PREVIEW_SIZE),
        enabled: previewEnabled,
    })
    const starGroupsPreviewQuery = useQuery({
        queryKey: queryKeys.starGroups(debouncedQuery, 0, PREVIEW_SIZE),
        queryFn: () => searchStarGroups(debouncedQuery, 0, PREVIEW_SIZE),
        enabled: previewEnabled,
    })
    const snapsPreviewQuery = useQuery({
        queryKey: queryKeys.snapsByTitle(debouncedQuery, 0, PREVIEW_SIZE),
        queryFn: () =>
            getSnaps({
                size: PREVIEW_SIZE,
                page: 0,
                tag: [],
                title: debouncedQuery,
                user: null,
                starId: [],
                starGroupId: [],
            }),
        enabled: previewEnabled,
    })

    // 개별 탭에서 보여줄 유형별 전체 목록
    const usersFullQuery = useQuery({
        queryKey: queryKeys.users(debouncedQuery, 0, FULL_SIZE),
        queryFn: () => searchUsers(debouncedQuery, 0, FULL_SIZE),
        enabled: tab === '유저',
    })
    const starsFullQuery = useQuery({
        queryKey: queryKeys.stars(debouncedQuery, 0, FULL_SIZE),
        queryFn: () => searchStars(debouncedQuery, 0, FULL_SIZE),
        enabled: tab === '스타',
    })
    const starGroupsFullQuery = useQuery({
        queryKey: queryKeys.starGroups(debouncedQuery, 0, FULL_SIZE),
        queryFn: () => searchStarGroups(debouncedQuery, 0, FULL_SIZE),
        enabled: tab === '스타그룹',
    })
    const snapsFullQuery = useQuery({
        queryKey: queryKeys.snapsByTitle(debouncedQuery, 0, FULL_SIZE),
        queryFn: () =>
            getSnaps({
                size: FULL_SIZE,
                page: 0,
                tag: [],
                title: debouncedQuery,
                user: null,
                starId: [],
                starGroupId: [],
            }),
        enabled: tab === '스냅',
    })

    const trending =
        popularKeywordsQuery.data && popularKeywordsQuery.data.length > 0
            ? popularKeywordsQuery.data
            : fallbackTrending

    const feedItems = feedQuery.data?.content ?? []
    const feedSnaps: Snap[] = feedItems.map(toSnapCard)
    const feedItemMap = useMemo(() => toSnapItemMap(feedItems), [feedItems])

    const snapsPreviewItems = snapsPreviewQuery.data?.content ?? []
    const snapsPreviewSnaps: Snap[] = snapsPreviewItems.map(toSnapCard)
    const snapsPreviewItemMap = useMemo(() => toSnapItemMap(snapsPreviewItems), [snapsPreviewItems])

    const snapsFullItems = snapsFullQuery.data?.content ?? []
    const snapsFullSnaps: Snap[] = snapsFullItems.map(toSnapCard)
    const snapsFullItemMap = useMemo(() => toSnapItemMap(snapsFullItems), [snapsFullItems])

    const handleSnapClick = useCallback(
        (snap: Snap, itemMap: Record<string, SnapFeedItem>) => {
            const feedItem = itemMap[snap.id]
            navigate(`/snap/${snap.id}`, { state: { feedItem } })
        },
        [navigate],
    )

    const usersPreview = usersPreviewQuery.data ?? []
    const starsPreview = starsPreviewQuery.data ?? []
    const starGroupsPreview = starGroupsPreviewQuery.data ?? []
    const previewLoading =
        usersPreviewQuery.isLoading ||
        starsPreviewQuery.isLoading ||
        starGroupsPreviewQuery.isLoading ||
        snapsPreviewQuery.isLoading
    const hasPreviewResults =
        usersPreview.length > 0 ||
        starsPreview.length > 0 ||
        starGroupsPreview.length > 0 ||
        snapsPreviewItems.length > 0

    const usersFull = usersFullQuery.data ?? []
    const starsFull = starsFullQuery.data ?? []
    const starGroupsFull = starGroupsFullQuery.data ?? []

    return (
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <h1 className="text-2xl font-bold text-ink">탐색</h1>
            <p className="mt-1 text-sm text-sub">스타, 유저, 스냅을 검색해보세요</p>

            <div className="mt-5 max-w-2xl">
                <div className="relative">
                    <label htmlFor="search-query" className="sr-only">스타, 유저, 스냅 검색</label>
                    <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        id="search-query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-12 rounded-full border border-line bg-panel pl-12 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
                        placeholder="스타, 유저, 스냅 검색"
                    />
                </div>

                {tab === '전체' && !isSearching && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted mr-1">인기 검색어</span>
                        {trending.map((t) => (
                            <button
                                key={t}
                                onClick={() => setQuery(t)}
                                className="min-h-11 px-4 rounded-full bg-surface text-sub text-sm border border-line hover:bg-panel"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-7">
                <CategoryChips items={[...EXPLORE_TABS]} active={tab} onChange={(value) => setTab(value as ExploreTab)} />
            </div>

            <div className="mt-6">
                {tab === '전체' &&
                    (isSearching ? (
                        <div className="space-y-8">
                            {previewLoading ? (
                                <StarListSkeleton />
                            ) : !hasPreviewResults ? (
                                <EmptyMessage text={`'${debouncedQuery}'에 대한 검색 결과가 없습니다.`} />
                            ) : (
                                <>
                                    {usersPreview.length > 0 && (
                                        <section>
                                            <div className="flex items-center justify-between mb-3">
                                                <h2 className="text-lg font-bold text-ink">유저</h2>
                                                <button className="text-sm text-sub hover:text-ink" onClick={() => setTab('유저')}>
                                                    더보기
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                                {usersPreview.map((user) => (
                                                    <UserResultCard
                                                        key={user.userId}
                                                        user={user}
                                                        onClick={() => navigate(`/user/${encodeURIComponent(user.username)}`)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {starsPreview.length > 0 && (
                                        <section>
                                            <div className="flex items-center justify-between mb-3">
                                                <h2 className="text-lg font-bold text-ink">스타</h2>
                                                <button className="text-sm text-sub hover:text-ink" onClick={() => setTab('스타')}>
                                                    더보기
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                                {starsPreview.map((star) => (
                                                    <StarResultCard
                                                        key={`${star.id || 'name'}-${star.name}-${star.nickname || ''}`}
                                                        star={star}
                                                        onClick={() => navigate(`/star/${toStarRouteKey(star)}`)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {starGroupsPreview.length > 0 && (
                                        <section>
                                            <div className="flex items-center justify-between mb-3">
                                                <h2 className="text-lg font-bold text-ink">스타그룹</h2>
                                                <button className="text-sm text-sub hover:text-ink" onClick={() => setTab('스타그룹')}>
                                                    더보기
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                                {starGroupsPreview.map((group) => (
                                                    <StarGroupResultCard
                                                        key={group.id}
                                                        group={group}
                                                        onClick={() => navigate(`/stargroup/${group.id}`)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {snapsPreviewItems.length > 0 && (
                                        <section>
                                            <div className="flex items-center justify-between mb-3">
                                                <h2 className="text-lg font-bold text-ink">스냅</h2>
                                                <button className="text-sm text-sub hover:text-ink" onClick={() => setTab('스냅')}>
                                                    더보기
                                                </button>
                                            </div>
                                            <MasonryGrid
                                                snaps={snapsPreviewSnaps}
                                                onSnapClick={(snap) => handleSnapClick(snap, snapsPreviewItemMap)}
                                                isLoading={false}
                                            />
                                        </section>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <MasonryGrid
                            snaps={feedSnaps}
                            onSnapClick={(snap) => handleSnapClick(snap, feedItemMap)}
                            isLoading={feedQuery.isLoading}
                        />
                    ))}

                {tab === '유저' &&
                    (usersFullQuery.isLoading ? (
                        <StarListSkeleton />
                    ) : usersFull.length === 0 ? (
                        <EmptyMessage text="표시할 유저가 없습니다." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {usersFull.map((user) => (
                                <UserResultCard
                                    key={user.userId}
                                    user={user}
                                    onClick={() => navigate(`/user/${encodeURIComponent(user.username)}`)}
                                />
                            ))}
                        </div>
                    ))}

                {tab === '스타' &&
                    (starsFullQuery.isLoading ? (
                        <StarListSkeleton />
                    ) : starsFull.length === 0 ? (
                        <EmptyMessage text="표시할 스타가 없습니다." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {starsFull.map((star) => (
                                <StarResultCard
                                    key={`${star.id || 'name'}-${star.name}-${star.nickname || ''}`}
                                    star={star}
                                    onClick={() => navigate(`/star/${toStarRouteKey(star)}`)}
                                />
                            ))}
                        </div>
                    ))}

                {tab === '스타그룹' &&
                    (starGroupsFullQuery.isLoading ? (
                        <StarListSkeleton />
                    ) : starGroupsFull.length === 0 ? (
                        <EmptyMessage text="표시할 스타그룹이 없습니다." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {starGroupsFull.map((group) => (
                                <StarGroupResultCard
                                    key={group.id}
                                    group={group}
                                    onClick={() => navigate(`/stargroup/${group.id}`)}
                                />
                            ))}
                        </div>
                    ))}

                {tab === '스냅' && (
                    <MasonryGrid
                        snaps={snapsFullSnaps}
                        onSnapClick={(snap) => handleSnapClick(snap, snapsFullItemMap)}
                        isLoading={snapsFullQuery.isLoading}
                    />
                )}
            </div>
        </div>
    )
}

export default SearchPage
