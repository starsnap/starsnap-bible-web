import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import MasonryGrid from '../../components/ui/MasonryGrid'
import { getPhotoAspectRatio, type Snap } from '../../constant/mock/snaps'
import { getSavedSnaps, type SnapFeedItem } from '../../services/snapService'
import { queryKeys } from '../../services/queryKeys'

const toSnapCard = (item: SnapFeedItem, index: number): Snap => ({
    id: item.snapData.snapId,
    author: item.createdUser.username,
    authorImageKey: item.createdUser.imageKey ?? null,
    aspectRatio: getPhotoAspectRatio(item.snapData.photos?.[0], index),
    photoKey: item.snapData.photos?.[0]?.fileKey,
    liked: !!item.snapData.likeState,
})

const SavedPage: React.FC = () => {
    const navigate = useNavigate()
    const savedQuery = useQuery({
        queryKey: queryKeys.savedSnaps,
        queryFn: getSavedSnaps,
    })
    const loading = savedQuery.isLoading
    const error = savedQuery.isError ? '저장한 스냅을 불러오지 못했습니다.' : ''
    const savedItems: SnapFeedItem[] = savedQuery.data ?? []

    const snaps = useMemo(() => savedItems.map(toSnapCard), [savedItems])
    const feedItemMap = useMemo(
        () => Object.fromEntries(savedItems.map((fi) => [fi.snapData.snapId, fi])),
        [savedItems],
    )

    const handleSnapClick = useCallback(
        (snap: Snap) => {
            const feedItem = feedItemMap[snap.id]
            navigate(`/snap/${snap.id}`, { state: { feedItem } })
        },
        [feedItemMap, navigate],
    )

    return (
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <h1 className="text-2xl font-bold text-ink">저장됨</h1>
            <p className="mt-1 text-sm text-sub">내가 저장한 스냅을 모아봤어요</p>

            {loading ? (
                <div className="mt-6">
                    <MasonryGrid snaps={[]} onSnapClick={handleSnapClick} isLoading />
                </div>
            ) : error ? (
                <p className="mt-8 text-sm text-danger">{error}</p>
            ) : snaps.length === 0 ? (
                <p className="mt-8 text-sm text-muted">저장한 스냅이 아직 없습니다.</p>
            ) : (
                <div className="mt-6">
                    <MasonryGrid snaps={snaps} onSnapClick={handleSnapClick} />
                </div>
            )}
        </div>
    )
}

export default SavedPage
