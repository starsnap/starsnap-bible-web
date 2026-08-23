import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { HeartIcon } from '../icons'
import type { Snap } from '../../constant/mock/snaps'
import { likeSnap, type SnapFeedItem, type SnapSliceResponse } from '../../services/snapService'
import { applyNextImageCandidate, getImageCandidates } from '../../utils/s3Image'

type Props = {
    snap: Snap
    showAuthor?: boolean
    onClick?: () => void
}

const encodeFileKey = (fileKey: string) =>
    fileKey
        .split('/')
        .map((s) => encodeURIComponent(s))
        .join('/')

const buildS3Url = (baseUrl: string, fileKey: string) => `${baseUrl}/${encodeFileKey(fileKey)}`

const applyLikeStateToItem = (item: SnapFeedItem, snapId: string, linked: boolean): SnapFeedItem => {
    if (item.snapData.snapId !== snapId) return item

    return {
        ...item,
        snapData: {
            ...item.snapData,
            likeState: linked,
        },
    }
}

const applyLikeStateToSlice = (
    slice: SnapSliceResponse | undefined,
    snapId: string,
    linked: boolean,
): SnapSliceResponse | undefined => {
    if (!slice) return slice

    return {
        ...slice,
        content: slice.content.map((item) => applyLikeStateToItem(item, snapId, linked)),
    }
}

const applyLikeStateToList = (
    list: SnapFeedItem[] | undefined,
    snapId: string,
    linked: boolean,
): SnapFeedItem[] | undefined => {
    if (!list) return list
    return list.map((item) => applyLikeStateToItem(item, snapId, linked))
}

const SnapCard: React.FC<Props> = ({ snap, showAuthor = true, onClick }) => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [liked, setLiked] = useState(!!snap.liked)
    const [liking, setLiking] = useState(false)
    const photoKey = snap.photoKey
    const authorImageCandidates = getImageCandidates(snap.authorImageKey)

    useEffect(() => {
        setLiked(!!snap.liked)
    }, [snap.id, snap.liked])

    const handleLikeClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        if (liking) return

        setLiking(true)
        const previousLiked = liked

        try {
            const result = await likeSnap(snap.id)
            setLiked(result.linked)

            queryClient.setQueriesData(
                { queryKey: ['feed-snaps'] },
                (oldData: SnapSliceResponse | undefined) =>
                    applyLikeStateToSlice(oldData, snap.id, result.linked),
            )
            queryClient.setQueriesData(
                { queryKey: ['my-snaps'] },
                (oldData: SnapFeedItem[] | undefined) =>
                    applyLikeStateToList(oldData, snap.id, result.linked),
            )
            queryClient.setQueryData(
                ['saved-snaps'],
                (oldData: SnapFeedItem[] | undefined) =>
                    applyLikeStateToList(oldData, snap.id, result.linked),
            )
            queryClient.setQueriesData(
                { queryKey: ['snap-by-id'] },
                (oldData: SnapFeedItem | null | undefined) => {
                    if (!oldData || oldData.snapData.snapId !== snap.id) return oldData
                    return applyLikeStateToItem(oldData, snap.id, result.linked)
                },
            )
        } catch (error) {
            console.error('failed to toggle like', error)
            setLiked(previousLiked)
        } finally {
            setLiking(false)
        }
    }

    const handleAuthorClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        const username = snap.author.trim()
        if (!username) return
        navigate(`/user/${encodeURIComponent(username)}`)
    }

    return (
        <div
            className="group rounded-2xl overflow-hidden bg-panel border border-line cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition"
            onClick={onClick}
        >
            <div className="relative bg-placeholder overflow-hidden" style={{ aspectRatio: snap.aspectRatio }}>
                {photoKey && (
                    <img
                        src={buildS3Url(import.meta.env.VITE_S3_OUTPUT_BUCKET_URL, photoKey)}
                        alt="스냅 썸네일"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const img = e.currentTarget
                            if (img.dataset.fallback !== 'input') {
                                img.dataset.fallback = 'input'
                                img.src = buildS3Url(import.meta.env.VITE_S3_INPUT_BUCKET_URL, photoKey)
                            }
                        }}
                    />
                )}
                <button
                    onClick={handleLikeClick}
                    disabled={liking}
                    className="absolute top-2 right-2 w-11 h-11 rounded-full bg-[var(--ss-surface-translucent)] backdrop-blur flex items-center justify-center shadow-sm"
                    aria-label="좋아요"
                >
                    <HeartIcon
                        size={16}
                        className={liked ? 'text-danger' : 'text-sub'}
                        fill={liked ? 'currentColor' : 'none'}
                    />
                </button>
            </div>
            {showAuthor && (
                <button
                    type="button"
                    onClick={handleAuthorClick}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-surface/60 transition-colors"
                    aria-label={`${snap.author} 프로필 보기`}
                >
                    {authorImageCandidates.length > 0 ? (
                        <img
                            src={authorImageCandidates[0]}
                            alt={`${snap.author} 프로필`}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                            onError={(e) => applyNextImageCandidate(e.currentTarget, authorImageCandidates)}
                        />
                    ) : (
                        <span className="w-6 h-6 rounded-full bg-placeholder shrink-0" />
                    )}
                    <span className="text-sm text-ink truncate">{snap.author}</span>
                </button>
            )}
        </div>
    )
}

export default SnapCard
