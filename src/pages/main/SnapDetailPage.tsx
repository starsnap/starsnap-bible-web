import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { SnapFeedItem, SnapFeedComment, SnapSliceResponse } from '../../services/snapService'
import {
    likeSnap,
    saveSnap,
    unsaveSnap,
    createComment,
    deleteComment,
    reportComment,
    getSnapById,
    getRelatedSnaps,
    getMyProfile,
    deleteSnap,
    reportSnap,
    increaseSnapView,
    searchStarGroups,
    searchStars,
    toStarRouteKey,
    type StarGroupSearchItem,
    type StarSearchItem,
} from '../../services/snapService'
import { queryKeys } from '../../services/queryKeys'
import MasonryGrid from '../../components/ui/MasonryGrid'
import { getPhotoAspectRatio, type Snap } from '../../constant/mock/snaps'
import {
    HeartIcon,
    BookmarkIcon,
    ShareIcon,
    MoreIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    SendIcon,
    EditIcon,
} from '../../components/icons'
import { applyNextImageCandidate, getImageCandidates } from '../../utils/s3Image'

const encodeFileKey = (fileKey: string) =>
    fileKey
        .split('/')
        .map((s) => encodeURIComponent(s))
        .join('/')

const buildS3Url = (baseUrl: string, fileKey: string) => `${baseUrl}/${encodeFileKey(fileKey)}`
const normalizeText = (value: string) => value.replace(/\s+/g, '').toLowerCase()

type ConnectedStar = {
    id?: string
    name: string
    nickname?: string
    imageKey?: string | null
}

type ConnectedGroup = {
    id?: string
    name: string
    imageKey?: string | null
}

type ReportReason = {
    id: string
    label: string
    detail: string
}

const REPORT_REASONS: ReportReason[] = [
    { id: 'sexual', label: '성적 콘텐츠', detail: '성적으로 노골적이거나 불쾌감을 주는 콘텐츠입니다.' },
    { id: 'privacy', label: '개인정보 침해', detail: '개인정보를 무단으로 노출하거나 침해하는 콘텐츠입니다.' },
    { id: 'illegal', label: '불법 촬영 콘텐츠', detail: '불법 촬영물 또는 관련 가능성이 있는 콘텐츠입니다.' },
    { id: 'false', label: '잘못된 정보', detail: '허위 사실 또는 오해를 유발하는 정보가 포함되어 있습니다.' },
    { id: 'hate', label: '모욕적인 내용 또는 비난', detail: '특정 대상에 대한 모욕, 비난, 혐오 표현이 포함되어 있습니다.' },
]

const PHOTO_DOT_IDLE_MS = 1400

type SnapMutationQueues = {
    like: Map<string, Promise<void>>
    save: Map<string, Promise<void>>
}

const mutationQueuesByQueryClient = new WeakMap<QueryClient, SnapMutationQueues>()

const getSnapMutationQueues = (queryClient: QueryClient): SnapMutationQueues => {
    const existing = mutationQueuesByQueryClient.get(queryClient)
    if (existing) return existing

    const created = {
        like: new Map<string, Promise<void>>(),
        save: new Map<string, Promise<void>>(),
    }
    mutationQueuesByQueryClient.set(queryClient, created)
    return created
}

const enqueueSnapMutation = <T,>(
    queue: Map<string, Promise<void>>,
    snapId: string,
    mutation: () => Promise<T>,
): Promise<T> => {
    const previous = queue.get(snapId) ?? Promise.resolve()
    const operation = previous.then(mutation, mutation)
    const tail = operation.then(
        () => undefined,
        () => undefined,
    )
    queue.set(snapId, tail)

    return operation.finally(() => {
        if (queue.get(snapId) === tail) {
            queue.delete(snapId)
        }
    })
}

const normalizeIdList = (value: unknown): string[] => {
    if (typeof value === 'string') return [value]
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === 'string')
}

const normalizeNameList = (value: unknown): string[] => {
    if (typeof value === 'string') return [value]
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === 'string')
}

const normalizeStarObjectList = (value: unknown): ConnectedStar[] => {
    const list = Array.isArray(value) ? value : value ? [value] : []
    const result: ConnectedStar[] = []

    list.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const record = item as Record<string, unknown>
        const name = record.name
        if (typeof name !== 'string' || !name) return
        result.push({
            id: typeof record.id === 'string' ? record.id : undefined,
            name,
            nickname: typeof record.nickname === 'string' ? record.nickname : undefined,
        })
    })

    return result
}

const normalizeGroupObjectList = (value: unknown): ConnectedGroup[] => {
    const list = Array.isArray(value) ? value : value ? [value] : []
    const result: ConnectedGroup[] = []

    list.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const record = item as Record<string, unknown>
        const name = record.name
        if (typeof name !== 'string' || !name) return
        const imageKey =
            (typeof record.imageKey === 'string' && record.imageKey) ||
            (typeof record.profileImageUrl === 'string' && record.profileImageUrl) ||
            (typeof record.imageUrl === 'string' && record.imageUrl) ||
            null
        result.push({
            id: typeof record.id === 'string' ? record.id : undefined,
            name,
            imageKey,
        })
    })

    return result
}

const resolveCreatorImageKey = (value: unknown): string | null => {
    if (!value || typeof value !== 'object') return null
    const record = value as Record<string, unknown>
    const candidates = [
        record.imageKey,
        record.profileImageUrl,
        record.imageUrl,
        record.profileKey,
        record.profileImageKey,
        record.fileKey,
    ]

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim()
        }
    }

    return null
}

const applyLikeStateToFeedItem = (item: SnapFeedItem, linked: boolean): SnapFeedItem => ({
    ...item,
    snapData: {
        ...item.snapData,
        likeState: linked,
    },
})

const applySaveStateToFeedItem = (item: SnapFeedItem, saved: boolean): SnapFeedItem => ({
    ...item,
    snapData: {
        ...item.snapData,
        saveState: saved,
    },
})

const applyLikeStateToFeedList = (
    items: SnapFeedItem[] | undefined,
    snapId: string,
    linked: boolean,
): SnapFeedItem[] | undefined => {
    if (!items) return items
    return items.map((item) =>
        item.snapData.snapId === snapId ? applyLikeStateToFeedItem(item, linked) : item,
    )
}

const applySaveStateToFeedList = (
    items: SnapFeedItem[] | undefined,
    snapId: string,
    saved: boolean,
): SnapFeedItem[] | undefined => {
    if (!items) return items
    return items.map((item) =>
        item.snapData.snapId === snapId ? applySaveStateToFeedItem(item, saved) : item,
    )
}

const applyLikeStateToFeedSlice = (
    slice: SnapSliceResponse | undefined,
    snapId: string,
    linked: boolean,
): SnapSliceResponse | undefined => {
    if (!slice) return slice
    return {
        ...slice,
        content: applyLikeStateToFeedList(slice.content, snapId, linked) ?? slice.content,
    }
}

const applySaveStateToFeedSlice = (
    slice: SnapSliceResponse | undefined,
    snapId: string,
    saved: boolean,
): SnapSliceResponse | undefined => {
    if (!slice) return slice
    return {
        ...slice,
        content: applySaveStateToFeedList(slice.content, snapId, saved) ?? slice.content,
    }
}

const toRelatedSnapCard = (item: SnapFeedItem, index: number): Snap => ({
    id: item.snapData.snapId,
    author: item.createdUser.username,
    authorImageKey: item.createdUser.imageKey ?? null,
    aspectRatio: getPhotoAspectRatio(item.snapData.photos?.[0], index),
    photoKey: item.snapData.photos?.[0]?.fileKey,
    liked: !!item.snapData.likeState,
})

const SnapDetailSkeleton: React.FC = () => (
    <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7" aria-busy="true">
        <div className="h-4 w-16 rounded bg-placeholder animate-pulse" />
        <div className="mt-6 max-w-[560px] mx-auto animate-pulse">
            <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-placeholder" />
                <div className="space-y-1.5">
                    <span className="block h-3 w-24 rounded bg-placeholder" />
                    <span className="block h-2.5 w-16 rounded bg-placeholder" />
                </div>
                <span className="ml-auto h-9 w-9 rounded-xl bg-placeholder" />
            </div>
            <div className="mt-4 h-[44vh] max-h-[560px] w-full rounded-2xl bg-placeholder sm:h-[52vh]" />
            <div className="mt-4 flex items-center gap-2">
                <span className="h-9 w-20 rounded-xl bg-placeholder" />
                <span className="h-9 w-20 rounded-xl bg-placeholder" />
                <span className="ml-auto h-9 w-9 rounded-xl bg-placeholder" />
            </div>
            <div className="mt-6 h-8 w-3/5 rounded bg-placeholder" />
            <div className="mt-4 flex gap-2">
                <span className="h-7 w-16 rounded-full bg-placeholder" />
                <span className="h-7 w-20 rounded-full bg-placeholder" />
            </div>
            <div className="mt-8 space-y-3">
                <span className="block h-3 w-full rounded bg-placeholder" />
                <span className="block h-3 w-4/5 rounded bg-placeholder" />
            </div>
        </div>
    </div>
)

const SnapDetailPage: React.FC = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const mutationQueues = useMemo(() => getSnapMutationQueues(queryClient), [queryClient])
    const location = useLocation()
    const { snapId } = useParams<{ snapId: string }>()

    const state = (location.state as { feedItem?: SnapFeedItem; canEdit?: boolean } | null) ?? null
    const feedItem = state?.feedItem
    const targetSnapId = snapId ?? feedItem?.snapData.snapId ?? ''
    const [resolvedFeedItem, setResolvedFeedItem] = useState<SnapFeedItem | null>(feedItem ?? null)
    const [snapLoading, setSnapLoading] = useState(false)

    const [currentPhoto, setCurrentPhoto] = useState(0)
    const [snapTitle, setSnapTitle] = useState('')
    const [canEdit, setCanEdit] = useState(!!state?.canEdit)
    const [liked, setLiked] = useState(false)
    const [saved, setSaved] = useState(false)
    const [liking, setLiking] = useState(false)
    const [saving, setSaving] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)
    const [localComments, setLocalComments] = useState<SnapFeedComment[]>([])
    const [commentError, setCommentError] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuLoading, setMenuLoading] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [reportTarget, setReportTarget] = useState<{ type: 'snap' | 'comment'; id: string; username: string } | null>(null)
    const [selectedReportReason, setSelectedReportReason] = useState<ReportReason | null>(null)
    const [reportSubmitting, setReportSubmitting] = useState(false)
    const [reportBlockUser, setReportBlockUser] = useState(false)
    const [reportError, setReportError] = useState('')
    const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(null)
    const [deleteCommentLoading, setDeleteCommentLoading] = useState(false)
    const [commentActionError, setCommentActionError] = useState('')
    const [dragOffsetX, setDragOffsetX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [showPhotoDots, setShowPhotoDots] = useState(false)
    const dragStartXRef = useRef<number | null>(null)
    const dragDeltaXRef = useRef(0)
    const isDraggingRef = useRef(false)
    const dotHideTimeoutRef = useRef<number | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const commentInputRef = useRef<HTMLInputElement | null>(null)
    const commentsSectionRef = useRef<HTMLDivElement | null>(null)
    const viewedSnapIdRef = useRef<string | null>(null)
    const snapLoadRequestIdRef = useRef(0)
    const targetSnapIdRef = useRef(targetSnapId)
    const routeGenerationRef = useRef(0)
    const currentPhotoSnapIdRef = useRef(targetSnapId)
    const localCommentsSnapIdRef = useRef(targetSnapId)
    const isCurrentSnapOperation = useCallback(
        (operationSnapId: string, operationGeneration: number) =>
            targetSnapIdRef.current === operationSnapId &&
            routeGenerationRef.current === operationGeneration,
        [],
    )

    const activeFeedItem =
        resolvedFeedItem?.snapData.snapId === targetSnapId
            ? resolvedFeedItem
            : feedItem?.snapData.snapId === targetSnapId
              ? feedItem
              : null
    const visibleCurrentPhoto =
        currentPhotoSnapIdRef.current === targetSnapId ? currentPhoto : 0
    const visibleLocalComments =
        localCommentsSnapIdRef.current === targetSnapId ? localComments : []

    const handleLike = useCallback(async () => {
        if (liking || !activeFeedItem) return
        setLiking(true)
        const operationSnapId = activeFeedItem.snapData.snapId
        const operationGeneration = routeGenerationRef.current
        try {
            const result = await enqueueSnapMutation(mutationQueues.like, operationSnapId, () =>
                likeSnap(operationSnapId),
            )

            queryClient.setQueryData(
                queryKeys.feedSnaps(0, 24),
                (oldData: SnapSliceResponse | undefined) =>
                    applyLikeStateToFeedSlice(oldData, operationSnapId, result.linked),
            )
            queryClient.setQueryData(
                queryKeys.mySnaps(0, 100),
                (oldData: SnapFeedItem[] | undefined) =>
                    applyLikeStateToFeedList(oldData, operationSnapId, result.linked),
            )
            queryClient.setQueryData(
                queryKeys.savedSnaps,
                (oldData: SnapFeedItem[] | undefined) =>
                    applyLikeStateToFeedList(oldData, operationSnapId, result.linked),
            )
            queryClient.setQueryData(
                queryKeys.snapById(operationSnapId),
                (oldData: SnapFeedItem | null | undefined) =>
                    oldData ? applyLikeStateToFeedItem(oldData, result.linked) : oldData,
            )

            if (!isCurrentSnapOperation(operationSnapId, operationGeneration)) return

            setLiked(result.linked)
            setResolvedFeedItem((prev) =>
                prev && prev.snapData.snapId === operationSnapId
                    ? applyLikeStateToFeedItem(prev, result.linked)
                    : prev,
            )
        } catch {
            // No optimistic state was applied; keep the last confirmed server result.
        } finally {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setLiking(false)
            }
        }
    }, [liking, activeFeedItem, queryClient, isCurrentSnapOperation, mutationQueues])

    const handleSave = useCallback(async () => {
        if (saving || !activeFeedItem) return
        setSaving(true)
        const operationSnapId = activeFeedItem.snapData.snapId
        const operationGeneration = routeGenerationRef.current
        try {
            const nextSaved = !saved
            if (saved) {
                await enqueueSnapMutation(mutationQueues.save, operationSnapId, () =>
                    unsaveSnap(operationSnapId),
                )
            } else {
                await enqueueSnapMutation(mutationQueues.save, operationSnapId, () =>
                    saveSnap(operationSnapId),
                )
            }

            queryClient.setQueryData(
                queryKeys.feedSnaps(0, 24),
                (oldData: SnapSliceResponse | undefined) =>
                    applySaveStateToFeedSlice(oldData, operationSnapId, nextSaved),
            )
            queryClient.setQueryData(
                queryKeys.mySnaps(0, 100),
                (oldData: SnapFeedItem[] | undefined) =>
                    applySaveStateToFeedList(oldData, operationSnapId, nextSaved),
            )
            queryClient.setQueryData(
                queryKeys.savedSnaps,
                (oldData: SnapFeedItem[] | undefined) => {
                    if (!oldData) return oldData
                    if (nextSaved) {
                        const exists = oldData.some((item) => item.snapData.snapId === operationSnapId)
                        if (exists) {
                            return applySaveStateToFeedList(oldData, operationSnapId, true)
                        }
                        return [...oldData, applySaveStateToFeedItem(activeFeedItem, true)]
                    }
                    return oldData.filter((item) => item.snapData.snapId !== operationSnapId)
                },
            )
            queryClient.setQueryData(
                queryKeys.snapById(operationSnapId),
                (oldData: SnapFeedItem | null | undefined) =>
                    oldData ? applySaveStateToFeedItem(oldData, nextSaved) : oldData,
            )

            if (!isCurrentSnapOperation(operationSnapId, operationGeneration)) return

            setSaved(nextSaved)
            setResolvedFeedItem((prev) =>
                prev && prev.snapData.snapId === operationSnapId
                    ? applySaveStateToFeedItem(prev, nextSaved)
                    : prev,
            )
        } catch {
            // ignore
        } finally {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setSaving(false)
            }
        }
    }, [saving, saved, activeFeedItem, queryClient, isCurrentSnapOperation, mutationQueues])

    const handleCommentSubmit = useCallback(async () => {
        if (!activeFeedItem || !commentText.trim() || submittingComment) return
        const operationSnapId = activeFeedItem.snapData.snapId
        const operationGeneration = routeGenerationRef.current
        const submittedCommentText = commentText.trim()
        setSubmittingComment(true)
        setCommentError('')
        try {
            const createdComment = await createComment(operationSnapId, submittedCommentText)
            if (!isCurrentSnapOperation(operationSnapId, operationGeneration)) return

            localCommentsSnapIdRef.current = operationSnapId
            setLocalComments((prev) => [
                ...prev,
                {
                    id: (createdComment as any).id,
                    content: (createdComment as any).content ?? submittedCommentText,
                    username: (createdComment as any).username ?? '나',
                    createdAt: (createdComment as any).createdAt ?? new Date().toISOString(),
                    profileKey: (createdComment as any).profileKey ?? null,
                },
            ])
            setCommentText('')
        } catch (e) {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setCommentError(e instanceof Error ? e.message : '댓글 작성에 실패했습니다.')
            }
        } finally {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setSubmittingComment(false)
            }
        }
    }, [activeFeedItem, commentText, submittingComment, isCurrentSnapOperation])

    useEffect(() => {
        setResolvedFeedItem(feedItem?.snapData.snapId === targetSnapId ? feedItem : null)
    }, [feedItem, targetSnapId])

    useLayoutEffect(() => {
        targetSnapIdRef.current = targetSnapId
        routeGenerationRef.current += 1
        currentPhotoSnapIdRef.current = targetSnapId
        localCommentsSnapIdRef.current = targetSnapId
        setSnapLoading(targetSnapId.length > 0)
        setCurrentPhoto(0)
        setLocalComments([])
        setCommentText('')
        setCommentError('')
        setCommentActionError('')
        setLiking(false)
        setSaving(false)
        setSubmittingComment(false)
        setMenuLoading(false)
        setDeleteCommentLoading(false)
        setReportSubmitting(false)
        setCanEdit(false)
        setMenuOpen(false)
        setDeleteConfirmOpen(false)
        setDeleteCommentTarget(null)
        setReportTarget(null)
        setSelectedReportReason(null)
        setReportBlockUser(false)
        setReportError('')
        setDragOffsetX(0)
        setIsDragging(false)
        setShowPhotoDots(false)
        dragStartXRef.current = null
        dragDeltaXRef.current = 0
        isDraggingRef.current = false

        if (dotHideTimeoutRef.current !== null) {
            window.clearTimeout(dotHideTimeoutRef.current)
            dotHideTimeoutRef.current = null
        }

        return () => {
            routeGenerationRef.current += 1
            targetSnapIdRef.current = ''
        }
    }, [targetSnapId])

    useLayoutEffect(() => {
        if (!activeFeedItem) return
        setSnapTitle(activeFeedItem.snapData.title)
        setLiked(!!activeFeedItem.snapData.likeState)
        setSaved(!!activeFeedItem.snapData.saveState)
    }, [activeFeedItem])

    useEffect(() => {
        if (!targetSnapId) {
            snapLoadRequestIdRef.current += 1
            setSnapLoading(false)
            return
        }

        const requestId = ++snapLoadRequestIdRef.current
        const requestGeneration = routeGenerationRef.current
        setSnapLoading(true)

        const loadSnapDetail = async () => {
            try {
                const latest = await getSnapById(targetSnapId)
                if (
                    snapLoadRequestIdRef.current !== requestId ||
                    targetSnapIdRef.current !== targetSnapId ||
                    routeGenerationRef.current !== requestGeneration
                ) {
                    return
                }
                if (latest?.snapData.snapId === targetSnapId) {
                    setResolvedFeedItem(latest)
                }
            } catch {
                // Keep route-state data when the refresh fails.
            } finally {
                if (
                    snapLoadRequestIdRef.current === requestId &&
                    targetSnapIdRef.current === targetSnapId &&
                    routeGenerationRef.current === requestGeneration
                ) {
                    setSnapLoading(false)
                }
            }
        }

        void loadSnapDetail()

        return () => {
            if (snapLoadRequestIdRef.current === requestId) {
                snapLoadRequestIdRef.current += 1
            }
        }
    }, [targetSnapId])

    useLayoutEffect(() => {
        const photoCount = Math.max(activeFeedItem?.snapData.photos?.length ?? 0, 1)
        setCurrentPhoto((current) => Math.min(current, photoCount - 1))
    }, [activeFeedItem?.snapData.snapId, activeFeedItem?.snapData.photos?.length])

    useEffect(() => {
        if (!targetSnapId) return
        if (viewedSnapIdRef.current === targetSnapId) return

        viewedSnapIdRef.current = targetSnapId
        void increaseSnapView(targetSnapId)
    }, [targetSnapId])

    useEffect(() => {
        if (!menuOpen) return

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node
            if (menuRef.current && !menuRef.current.contains(target)) {
                setMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', onPointerDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
        }
    }, [menuOpen])

    useEffect(() => {
        return () => {
            if (dotHideTimeoutRef.current !== null) {
                window.clearTimeout(dotHideTimeoutRef.current)
            }
        }
    }, [])

    const myProfileQuery = useQuery({
        queryKey: queryKeys.myProfile,
        queryFn: getMyProfile,
        enabled: !!activeFeedItem && !state?.canEdit,
    })

    useEffect(() => {
        if (!activeFeedItem) return
        if (state?.canEdit) {
            setCanEdit(true)
            return
        }
        if (!myProfileQuery.data) return

        setCanEdit(myProfileQuery.data.username === activeFeedItem.createdUser.username)
    }, [activeFeedItem, state?.canEdit, myProfileQuery.data])

    const starsQuery = useQuery({
        queryKey: queryKeys.stars('', 0, 500),
        queryFn: () => searchStars('', 0, 500),
        enabled: !!activeFeedItem,
    })

    const starGroupsQuery = useQuery({
        queryKey: queryKeys.starGroups('', 0, 500),
        queryFn: () => searchStarGroups('', 0, 500),
        enabled: !!activeFeedItem,
    })

    const relatedSourceSnapId = snapId ?? activeFeedItem?.snapData.snapId ?? ''
    const relatedSnapsQuery = useQuery({
        queryKey: queryKeys.relatedSnaps(relatedSourceSnapId, 0, 12),
        queryFn: () => getRelatedSnaps(relatedSourceSnapId, 0, 12),
        enabled: relatedSourceSnapId.length > 0,
    })

    const relatedFeedItems = useMemo(
        () =>
            (relatedSnapsQuery.data?.content ?? []).filter(
                (item) => item.snapData.snapId !== relatedSourceSnapId,
            ),
        [relatedSnapsQuery.data?.content, relatedSourceSnapId],
    )
    const relatedSnaps = useMemo(
        () => relatedFeedItems.map(toRelatedSnapCard),
        [relatedFeedItems],
    )
    const relatedFeedItemMap = useMemo(
        () => new Map(relatedFeedItems.map((item) => [item.snapData.snapId, item])),
        [relatedFeedItems],
    )
    const handleRelatedSnapClick = useCallback(
        (relatedSnap: Snap) => {
            if (relatedSnap.id === relatedSourceSnapId) return
            const relatedFeedItem = relatedFeedItemMap.get(relatedSnap.id)
            navigate(`/snap/${relatedSnap.id}`, { state: { feedItem: relatedFeedItem } })
        },
        [navigate, relatedFeedItemMap, relatedSourceSnapId],
    )

    const handleGoEditPage = useCallback(() => {
        if (!activeFeedItem || !canEdit) return
        setMenuOpen(false)
        navigate(`/snap/${activeFeedItem.snapData.snapId}/edit`, {
            state: {
                feedItem: {
                    ...activeFeedItem,
                    snapData: {
                        ...activeFeedItem.snapData,
                        title: snapTitle || activeFeedItem.snapData.title,
                    },
                },
                canEdit: true,
            },
        })
    }, [activeFeedItem, canEdit, navigate, snapTitle])

    const handleDeleteSnap = useCallback(async () => {
        if (!activeFeedItem || !canEdit || menuLoading) return

        const operationSnapId = activeFeedItem.snapData.snapId
        const operationGeneration = routeGenerationRef.current
        setMenuLoading(true)
        try {
            await deleteSnap(operationSnapId)
            if (!isCurrentSnapOperation(operationSnapId, operationGeneration)) return

            setDeleteConfirmOpen(false)
            setMenuOpen(false)
            navigate('/profile', { replace: true })
        } catch {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setDeleteConfirmOpen(false)
                window.alert('스냅 삭제에 실패했습니다.')
            }
        } finally {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setMenuLoading(false)
            }
        }
    }, [activeFeedItem, canEdit, menuLoading, navigate, isCurrentSnapOperation])

    const handleReportSnap = useCallback(async () => {
        if (!activeFeedItem || menuLoading) return
        setMenuOpen(false)
        setSelectedReportReason(null)
        setReportBlockUser(false)
        setReportError('')
        setReportTarget({ type: 'snap', id: activeFeedItem.snapData.snapId, username: createdUser.username })
    }, [activeFeedItem, menuLoading])

    const handleReportComment = useCallback((comment: SnapFeedComment) => {
        const commentId = comment.id
        if (!commentId) return
        setSelectedReportReason(null)
        setReportBlockUser(false)
        setReportError('')
        setReportTarget({ type: 'comment', id: commentId, username: comment.username ?? '알 수 없음' })
    }, [])

    const handleDeleteComment = useCallback(async (commentId: string) => {
        if (deleteCommentLoading || !activeFeedItem) return
        const operationSnapId = activeFeedItem.snapData.snapId
        const operationGeneration = routeGenerationRef.current
        setDeleteCommentLoading(true)
        setCommentActionError('')
        try {
            await deleteComment(commentId)
            if (!isCurrentSnapOperation(operationSnapId, operationGeneration)) return

            localCommentsSnapIdRef.current = operationSnapId
            setLocalComments((prev) => prev.filter((c) => c.id !== commentId))
            setResolvedFeedItem((prev) =>
                prev?.snapData.snapId === operationSnapId
                    ? {
                          ...prev,
                          snapData: {
                              ...prev.snapData,
                              comments: (prev.snapData.comments ?? []).filter((c) => c.id !== commentId),
                          },
                      }
                    : prev,
            )
            setDeleteCommentTarget(null)
        } catch {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setCommentActionError('댓글 삭제에 실패했습니다.')
            }
        } finally {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setDeleteCommentLoading(false)
            }
        }
    }, [activeFeedItem, deleteCommentLoading, isCurrentSnapOperation])

    const handleCloseReportSheet = useCallback(() => {
        if (reportSubmitting) return
        setReportTarget(null)
        setSelectedReportReason(null)
        setReportBlockUser(false)
        setReportError('')
    }, [reportSubmitting])

    const handleSubmitReport = useCallback(async () => {
        if (!reportTarget || !selectedReportReason || reportSubmitting || !targetSnapId) return

        const operationSnapId = targetSnapId
        const operationGeneration = routeGenerationRef.current
        setReportSubmitting(true)
        setReportError('')
        try {
            const explanation = reportBlockUser
                ? `${selectedReportReason.label} (작성자 차단 요청)`
                : selectedReportReason.label
            if (reportTarget.type === 'snap') {
                await reportSnap(reportTarget.id, explanation)
            } else {
                await reportComment(reportTarget.id, explanation)
            }
            if (!isCurrentSnapOperation(operationSnapId, operationGeneration)) return

            setReportTarget(null)
            setSelectedReportReason(null)
            setReportBlockUser(false)
            window.alert('신고가 접수되었습니다.')
        } catch {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setReportError('신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.')
            }
        } finally {
            if (isCurrentSnapOperation(operationSnapId, operationGeneration)) {
                setReportSubmitting(false)
            }
        }
    }, [reportTarget, selectedReportReason, reportSubmitting, reportBlockUser, targetSnapId, isCurrentSnapOperation])

    // Hooks below must run unconditionally on every render (Rules of Hooks) — a direct/hard
    // navigation to this page renders once with activeFeedItem still null before the async
    // fetch resolves, so these can't be declared after the early returns further down or the
    // hook count changes between renders and React throws (blank page, minified error #310).
    const safeSnapData = activeFeedItem?.snapData
    const safeSnapRecord = (safeSnapData ?? {}) as unknown as Record<string, unknown>
    const safeRootRecord = (activeFeedItem ?? {}) as unknown as Record<string, unknown>

    const connectedStars = useMemo(() => {
        const starMap = new Map<string, ConnectedStar>()
        const starById = new Map((starsQuery.data ?? []).map((star: StarSearchItem) => [star.id, star]))
        const stars = starsQuery.data ?? []
        const addStar = (star: ConnectedStar) => {
            const key = star.id || `${star.name}::${star.nickname ?? ''}`
            if (!key) return
            if (!starMap.has(key)) {
                starMap.set(key, star)
            }
        }

        const starIds = [
            ...normalizeIdList(safeSnapRecord.starId),
            ...normalizeIdList(safeSnapRecord.starIds),
            ...normalizeIdList(safeRootRecord.starId),
            ...normalizeIdList(safeRootRecord.starIds),
        ]
        starIds.forEach((id) => {
            const star = starById.get(id)
            if (star?.name) {
                addStar({ id: star.id, name: star.name, nickname: star.nickname, imageKey: star.imageKey })
            }
        })

        const starsFromObjects = [
            ...normalizeStarObjectList(safeSnapRecord.star),
            ...normalizeStarObjectList(safeSnapRecord.stars),
            ...normalizeStarObjectList(safeRootRecord.star),
            ...normalizeStarObjectList(safeRootRecord.stars),
        ]
        starsFromObjects.forEach(addStar)

        const starsFromNames = [
            ...normalizeNameList(safeSnapRecord.starName),
            ...normalizeNameList(safeSnapRecord.starNames),
            ...normalizeNameList(safeRootRecord.starName),
            ...normalizeNameList(safeRootRecord.starNames),
        ]
        starsFromNames.forEach((name) => addStar({ name }))

        const tags = (safeSnapData?.tags ?? []).map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean)
        tags.forEach((tagName) => {
            const normalizedTag = normalizeText(tagName)
            const matched = stars.filter(
                (star) =>
                    normalizeText(star.name) === normalizedTag ||
                    (star.nickname ? normalizeText(star.nickname) === normalizedTag : false),
            )
            matched.forEach((star) =>
                addStar({ id: star.id, name: star.name, nickname: star.nickname, imageKey: star.imageKey }),
            )
        })

        return Array.from(starMap.values())
    }, [safeSnapRecord, safeRootRecord, safeSnapData?.tags, starsQuery.data])

    const connectedStarGroups = useMemo(() => {
        const groupMap = new Map<string, ConnectedGroup>()
        const groupById = new Map(
            (starGroupsQuery.data ?? []).map((group: StarGroupSearchItem) => [group.id, group]),
        )
        const starById = new Map((starsQuery.data ?? []).map((star: StarSearchItem) => [star.id, star]))
        const groups = starGroupsQuery.data ?? []
        const addGroup = (group: ConnectedGroup) => {
            const resolvedImageKey =
                group.imageKey ?? (group.id ? groupById.get(group.id)?.imageKey : undefined)
            const normalizedGroup: ConnectedGroup = {
                ...group,
                imageKey: resolvedImageKey,
            }

            const key = normalizedGroup.id || normalizedGroup.name
            if (!key) return

            // If a name-only entry exists first, merge it into id-based entry when id is later found.
            if (normalizedGroup.id && groupMap.has(normalizedGroup.name)) {
                const byName = groupMap.get(normalizedGroup.name)
                if (byName) {
                    groupMap.delete(normalizedGroup.name)
                    groupMap.set(normalizedGroup.id, {
                        id: normalizedGroup.id,
                        name: normalizedGroup.name,
                        imageKey: normalizedGroup.imageKey ?? byName.imageKey,
                    })
                    return
                }
            }

            if (!groupMap.has(key)) {
                groupMap.set(key, normalizedGroup)
                return
            }

            const existing = groupMap.get(key)
            if (!existing) return

            groupMap.set(key, {
                id: existing.id ?? normalizedGroup.id,
                name: existing.name || normalizedGroup.name,
                imageKey: existing.imageKey ?? normalizedGroup.imageKey,
            })
        }

        const groupIds = [
            ...normalizeIdList(safeSnapRecord.starGroupId),
            ...normalizeIdList(safeSnapRecord.starGroupIds),
            ...normalizeIdList(safeRootRecord.starGroupId),
            ...normalizeIdList(safeRootRecord.starGroupIds),
            ...normalizeIdList((safeSnapRecord.starGroup as Record<string, unknown> | null)?.id),
            ...normalizeIdList((safeRootRecord.starGroup as Record<string, unknown> | null)?.id),
        ]
        groupIds.forEach((id) => {
            const group = groupById.get(id)
            if (group?.name) addGroup({ id: group.id, name: group.name, imageKey: group.imageKey })
        })

        const groupsFromObjects = [
            ...normalizeGroupObjectList(safeSnapRecord.starGroup),
            ...normalizeGroupObjectList(safeSnapRecord.starGroups),
            ...normalizeGroupObjectList(safeRootRecord.starGroup),
            ...normalizeGroupObjectList(safeRootRecord.starGroups),
        ]
        groupsFromObjects.forEach(addGroup)

        const groupsFromNames = [
            ...normalizeNameList(safeSnapRecord.starGroupName),
            ...normalizeNameList(safeSnapRecord.starGroupNames),
            ...normalizeNameList(safeRootRecord.starGroupName),
            ...normalizeNameList(safeRootRecord.starGroupNames),
        ]
        groupsFromNames.forEach((name) => addGroup({ name }))

        const starIds = [
            ...normalizeIdList(safeSnapRecord.starId),
            ...normalizeIdList(safeSnapRecord.starIds),
            ...normalizeIdList(safeRootRecord.starId),
            ...normalizeIdList(safeRootRecord.starIds),
        ]
        starIds.forEach((id) => {
            const star = starById.get(id)
            const group = star?.starGroup
            if (group?.name) addGroup({ id: group.id, name: group.name, imageKey: groupById.get(group.id ?? '')?.imageKey })
        })

        connectedStars.forEach((star) => {
            if (star.id) {
                const fullStar = starById.get(star.id)
                const group = fullStar?.starGroup
                if (group?.name) addGroup({ id: group.id, name: group.name, imageKey: groupById.get(group.id ?? '')?.imageKey })
                return
            }
            const matchedStar = (starsQuery.data ?? []).find(
                (candidate) => normalizeText(candidate.name) === normalizeText(star.name),
            )
            const group = matchedStar?.starGroup
            if (group?.name) addGroup({ id: group.id, name: group.name, imageKey: groupById.get(group.id ?? '')?.imageKey })
        })

        const titleText = (snapTitle || safeSnapData?.title || '').trim()
        if (titleText) {
            const normalizedTitle = normalizeText(titleText)
            const matchedByTitle = groups.filter((group) => normalizeText(group.name) === normalizedTitle)
            matchedByTitle.forEach((group) => addGroup({ id: group.id, name: group.name, imageKey: group.imageKey }))
        }

        return Array.from(groupMap.values())
    }, [connectedStars, safeSnapData?.title, safeSnapRecord, safeRootRecord, snapTitle, starGroupsQuery.data, starsQuery.data])

    const showPhotoDotsTemporarily = useCallback(() => {
        setShowPhotoDots(true)

        if (dotHideTimeoutRef.current !== null) {
            window.clearTimeout(dotHideTimeoutRef.current)
        }

        dotHideTimeoutRef.current = window.setTimeout(() => {
            setShowPhotoDots(false)
            dotHideTimeoutRef.current = null
        }, PHOTO_DOT_IDLE_MS)
    }, [])

    if (snapLoading && !activeFeedItem) {
        return <SnapDetailSkeleton />
    }

    if (!activeFeedItem) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-sub hover:text-ink"
                >
                    <ChevronLeftIcon size={16} />
                    뒤로가기
                </button>
                <div className="mt-24 text-center">
                    <p className="text-sub text-sm">스냅 정보를 찾을 수 없습니다.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 h-9 px-5 rounded-xl bg-brand text-on-brand text-sm font-bold"
                    >
                        돌아가기
                    </button>
                </div>
            </div>
        )
    }

    const { snapData, createdUser } = activeFeedItem
    const snapRecord = snapData as unknown as Record<string, unknown>
    const rootRecord = activeFeedItem as unknown as Record<string, unknown>
    const creatorImageKey =
        resolveCreatorImageKey(createdUser) ||
        resolveCreatorImageKey(rootRecord.createdUser) ||
        resolveCreatorImageKey(rootRecord.user)
    const creatorImageCandidates = getImageCandidates(creatorImageKey)
    const photos = snapData.photos ?? []
    const photoCount = Math.max(photos.length, 1)
    const allComments = [...(snapData.comments ?? []), ...visibleLocalComments]

    const formattedDate = snapData.createdAt
        ? new Date(snapData.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : ''

    const prevPhoto = () => {
        currentPhotoSnapIdRef.current = targetSnapId
        setCurrentPhoto((p) => Math.max(0, p - 1))
        showPhotoDotsTemporarily()
    }

    const nextPhoto = () => {
        currentPhotoSnapIdRef.current = targetSnapId
        setCurrentPhoto((p) => Math.min(photoCount - 1, p + 1))
        showPhotoDotsTemporarily()
    }

    const handlePhotoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (photoCount <= 1) return
        const target = e.target as HTMLElement
        if (target.closest('button')) return

        dragStartXRef.current = e.clientX
        dragDeltaXRef.current = 0
        isDraggingRef.current = true
        setIsDragging(true)
        setDragOffsetX(0)
        showPhotoDotsTemporarily()
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePhotoPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current || dragStartXRef.current === null) return
        const deltaX = e.clientX - dragStartXRef.current
        dragDeltaXRef.current = deltaX
        setDragOffsetX(deltaX)
    }

    const handlePhotoPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return

        isDraggingRef.current = false
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }

        const deltaX = dragDeltaXRef.current
        dragStartXRef.current = null
        dragDeltaXRef.current = 0
        setIsDragging(false)
        setDragOffsetX(0)

        if (Math.abs(deltaX) < 40) return
        if (deltaX > 0) {
            prevPhoto()
        } else {
            nextPhoto()
        }
    }

    const displayPhotos = photos.length > 0 ? photos : [{ fileKey: '' }]

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-sub hover:text-ink mb-4 sm:mb-6 transition-colors"
            >
                <ChevronLeftIcon size={16} />
                뒤로가기
            </button>

            <div className="max-w-[560px] mx-auto flex flex-col gap-4 items-start">
                {/* ──────── Photo Gallery ──────── */}
                <div className="w-full min-w-0">
                    {/* Photo top bar */}
                    <div className="mb-3 sm:mb-4 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(`/user/${encodeURIComponent(createdUser.username)}`)}
                            className="flex items-center gap-3 min-w-0 text-left"
                            aria-label={`${createdUser.username} 프로필 보기`}
                        >
                            {creatorImageCandidates.length > 0 ? (
                                <img
                                    src={creatorImageCandidates[0]}
                                    alt={`${createdUser.username} 프로필`}
                                    width={36}
                                    height={36}
                                    loading="lazy"
                                    className="w-9 h-9 rounded-full object-cover border border-line shrink-0"
                                    onError={(e) => applyNextImageCandidate(e.currentTarget, creatorImageCandidates)}
                                />
                            ) : (
                                <span className="w-9 h-9 rounded-full bg-placeholder border border-line shrink-0" />
                            )}
                            <div className="min-w-0">
                                <p className="font-bold leading-tight truncate text-ink">{createdUser.username}</p>
                                {formattedDate && <p className="text-xs text-muted mt-0.5">{formattedDate}</p>}
                            </div>
                        </button>
                        <div className="ml-auto relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((prev) => !prev)}
                                className="h-9 w-9 rounded-xl border border-line bg-panel flex items-center justify-center text-sub hover:text-ink hover:border-ink transition-colors"
                                aria-label="스냅 메뉴"
                            >
                                <MoreIcon size={16} />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 top-11 z-20 w-36 rounded-xl border border-line bg-panel shadow-lg p-1.5">
                                    {canEdit && (
                                        <button
                                            onClick={handleGoEditPage}
                                            disabled={menuLoading}
                                            className="w-full h-9 rounded-lg px-3 text-left text-sm text-ink hover:bg-surface disabled:opacity-60 flex items-center gap-2"
                                        >
                                            <EditIcon size={14} className="text-sub" />
                                            수정
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button
                                            onClick={() => {
                                                setMenuOpen(false)
                                                setDeleteConfirmOpen(true)
                                            }}
                                            disabled={menuLoading}
                                            className="w-full h-9 rounded-lg px-3 text-left text-sm text-danger hover:bg-danger/10 disabled:opacity-60"
                                        >
                                            삭제
                                        </button>
                                    )}
                                    <button
                                        onClick={() => void handleReportSnap()}
                                        disabled={menuLoading}
                                        className="w-full h-9 rounded-lg px-3 text-left text-sm text-ink hover:bg-surface disabled:opacity-60"
                                    >
                                        신고
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main photo area */}
                    <div
                        className="relative rounded-2xl overflow-hidden bg-placeholder w-full h-[44vh] sm:h-[52vh] max-h-[560px] select-none cursor-grab active:cursor-grabbing"
                        onPointerDown={handlePhotoPointerDown}
                        onPointerMove={handlePhotoPointerMove}
                        onPointerUp={handlePhotoPointerEnd}
                        onPointerCancel={handlePhotoPointerEnd}
                    >
                        <div
                            className="h-full flex"
                            style={{
                                transform: `translateX(calc(${visibleCurrentPhoto * -100}% + ${dragOffsetX}px))`,
                                transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        >
                            {displayPhotos.map((photo, idx) => (
                                <div key={photo.fileKey || idx} className="h-full w-full shrink-0">
                                    {photo.fileKey ? (
                                        <img
                                            src={buildS3Url(
                                                import.meta.env.VITE_S3_OUTPUT_BUCKET_URL,
                                                photo.fileKey,
                                            )}
                                            alt="스냅 사진"
                                            width={1200}
                                            height={1200}
                                            className="w-full h-full object-cover"
                                            draggable={false}
                                            onError={(e) => {
                                                const img = e.currentTarget
                                                if (img.dataset.fallback !== 'input') {
                                                    img.dataset.fallback = 'input'
                                                    img.src = buildS3Url(
                                                        import.meta.env.VITE_S3_INPUT_BUCKET_URL,
                                                        photo.fileKey,
                                                    )
                                                }
                                            }}
                                        />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                        {/* Prev button */}
                        {visibleCurrentPhoto > 0 && (
                            <button
                                onClick={prevPhoto}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--ss-surface-translucent)] backdrop-blur flex items-center justify-center shadow-sm z-10 hover:bg-panel transition-colors"
                                aria-label="이전 사진"
                            >
                                <ChevronLeftIcon size={18} className="text-ink" />
                            </button>
                        )}
                        {/* Next button */}
                        {visibleCurrentPhoto < photoCount - 1 && (
                            <button
                                onClick={nextPhoto}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--ss-surface-translucent)] backdrop-blur flex items-center justify-center shadow-sm z-10 hover:bg-panel transition-colors"
                                aria-label="다음 사진"
                            >
                                <ChevronRightIcon size={18} className="text-ink" />
                            </button>
                        )}
                        {/* Photo count badge */}
                        {photoCount > 1 && (
                            <span className="absolute top-3 right-3 bg-black/50 text-on-media text-xs px-2.5 py-1 rounded-full z-10">
                                {visibleCurrentPhoto + 1} / {photoCount}
                            </span>
                        )}

                        {photoCount > 1 && (
                            <div
                                className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-700 ${
                                    showPhotoDots || isDragging ? 'opacity-100' : 'opacity-0'
                                }`}
                                aria-hidden={!(showPhotoDots || isDragging)}
                            >
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: photoCount }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                currentPhotoSnapIdRef.current = targetSnapId
                                                setCurrentPhoto(i)
                                                showPhotoDotsTemporarily()
                                            }}
                                            className={`pointer-events-auto h-2 w-2 rounded-full bg-brand transition-opacity ${
                                                i === visibleCurrentPhoto ? 'opacity-100' : 'opacity-45'
                                            }`}
                                            aria-label={`${i + 1}번 사진으로 이동`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* ──────── Info Panel ──────── */}
                <div className="w-full shrink-0 flex flex-col">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleLike}
                            disabled={liking}
                            className={`flex items-center gap-1.5 h-9 px-4 rounded-xl border text-sm font-bold transition-colors disabled:opacity-60 ${
                                liked
                                    ? 'border-danger bg-danger/5 text-danger'
                                    : 'border-line text-sub hover:border-danger hover:text-danger'
                            }`}
                        >
                            <HeartIcon size={15} fill={liked ? 'currentColor' : 'none'} />
                            좋아요
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-1.5 h-9 px-4 rounded-xl border text-sm font-bold transition-colors disabled:opacity-60 ${
                                saved
                                    ? 'border-brand bg-brand/10 text-ink'
                                    : 'border-line text-sub hover:border-brand hover:text-ink'
                            }`}
                        >
                            <BookmarkIcon size={15} fill={saved ? 'currentColor' : 'none'} />
                            저장
                        </button>
                        <button
                            className="ml-auto h-9 w-9 rounded-xl border border-line flex items-center justify-center text-sub hover:text-ink hover:border-ink transition-colors"
                            aria-label="공유"
                        >
                            <ShareIcon size={15} />
                        </button>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-ink leading-snug mt-2">{snapTitle || snapData.title}</h1>

                    {/* Tags */}
                    {snapData.tags && snapData.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {snapData.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="h-7 px-3 rounded-full bg-surface border border-line text-sm text-sub"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Linked entities */}
                    {connectedStarGroups.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs text-muted mb-2">StarGroup</p>
                            <div className="flex items-start gap-3 overflow-x-auto pb-1">
                                {connectedStarGroups.map((group) => {
                                    const imageCandidates = getImageCandidates(group.imageKey)
                                    return (
                                        <button
                                            key={`${group.id ?? 'name'}:${group.name}`}
                                            onClick={() => {
                                                if (!group.id) return
                                                navigate(`/stargroup/${group.id}`)
                                            }}
                                            disabled={!group.id}
                                            className="shrink-0 w-14 flex flex-col items-center gap-1.5 disabled:cursor-default"
                                        >
                                            {imageCandidates.length > 0 ? (
                                                <img
                                                    src={imageCandidates[0]}
                                                    alt={`${group.name} 이미지`}
                                                    width={40}
                                                    height={40}
                                                    loading="lazy"
                                                    className="w-10 h-10 rounded-full object-cover border border-line"
                                                    onError={(e) =>
                                                        applyNextImageCandidate(e.currentTarget, imageCandidates)
                                                    }
                                                />
                                            ) : (
                                                <span className="w-10 h-10 rounded-full bg-placeholder border border-line" />
                                            )}
                                            <span className="text-xs text-sub truncate max-w-full">{group.name}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {connectedStars.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs text-muted mb-2">Star</p>
                            <div className="flex items-start gap-3 overflow-x-auto pb-1">
                                {connectedStars.map((star) => {
                                    const imageCandidates = getImageCandidates(star.imageKey)
                                    return (
                                        <button
                                            key={`${star.id ?? 'name'}:${star.name}:${star.nickname ?? ''}`}
                                            onClick={() => {
                                                navigate(`/star/${toStarRouteKey(star)}`)
                                            }}
                                            className="shrink-0 w-14 flex flex-col items-center gap-1.5"
                                        >
                                            {imageCandidates.length > 0 ? (
                                                <img
                                                    src={imageCandidates[0]}
                                                    alt={`${star.name} 이미지`}
                                                    width={40}
                                                    height={40}
                                                    loading="lazy"
                                                    className="w-10 h-10 rounded-full object-cover border border-line"
                                                    onError={(e) =>
                                                        applyNextImageCandidate(e.currentTarget, imageCandidates)
                                                    }
                                                />
                                            ) : (
                                                <span className="w-10 h-10 rounded-full bg-placeholder border border-line" />
                                            )}
                                            <span className="text-xs text-sub truncate max-w-full">{star.name}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <hr className="my-4 border-line" />

                    {/* Comments */}
                    {snapData.commentState ? (
                        <div ref={commentsSectionRef} className="flex flex-col gap-4 min-h-0">
                            <p className="text-sm font-bold text-ink">메시지</p>

                            {/* Comment list */}
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                {allComments.length === 0 ? (
                                    <p className="text-sm text-muted">메시지가 없습니다.</p>
                                ) : (
                                    allComments.map((c, i) => (
                                        <CommentRow
                                            key={c.id ?? i}
                                            comment={c}
                                            isMine={!!c.username && c.username === myProfileQuery.data?.username}
                                            onDelete={() => c.id && setDeleteCommentTarget(c.id)}
                                            onReport={() => handleReportComment(c)}
                                        />
                                    ))
                                )}
                            </div>
                            {commentActionError && (
                                <p className="text-xs text-danger">{commentActionError}</p>
                            )}

                            {/* Comment input */}
                            <div className="mt-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={commentInputRef}
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                void handleCommentSubmit()
                                            }
                                        }}
                                        placeholder="댓글을 입력하세요…"
                                        className="flex-1 h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
                                    />
                                    <button
                                        onClick={() => void handleCommentSubmit()}
                                        disabled={!commentText.trim() || submittingComment}
                                        className="h-9 w-9 rounded-lg bg-brand flex items-center justify-center disabled:opacity-50 hover:brightness-95 transition"
                                        aria-label="댓글 전송"
                                    >
                                        <SendIcon size={15} className="text-on-brand" />
                                    </button>
                                </div>
                                {commentError && (
                                    <p className="mt-1.5 text-xs text-danger">{commentError}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p ref={commentsSectionRef} className="text-sm text-muted">댓글이 비활성화된 스냅입니다.</p>
                    )}

                    <hr className="my-4 border-line" />
                    <section aria-labelledby="related-snaps-title">
                        <p id="related-snaps-title" className="text-sm font-bold text-ink">
                            유사한 스냅
                        </p>
                        <div className="mt-3">
                            {relatedSnapsQuery.isError ? (
                                <div className="rounded-xl border border-line bg-surface px-4 py-4 text-center">
                                    <p className="text-xs text-muted">연관 스냅을 불러오지 못했습니다.</p>
                                    <button
                                        type="button"
                                        onClick={() => void relatedSnapsQuery.refetch()}
                                        className="mt-2 text-xs font-bold text-ink underline underline-offset-2"
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            ) : relatedSnapsQuery.isLoading ? (
                                <MasonryGrid
                                    snaps={[]}
                                    showAuthor={false}
                                    columnsClass="columns-2 sm:columns-3"
                                    isLoading
                                />
                            ) : relatedSnaps.length > 0 ? (
                                <MasonryGrid
                                    snaps={relatedSnaps}
                                    showAuthor={false}
                                    columnsClass="columns-2 sm:columns-3"
                                    onSnapClick={handleRelatedSnapClick}
                                />
                            ) : (
                                <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-5 text-center text-xs text-muted">
                                    유사한 스냅이 없습니다.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {deleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="presentation">
                    <div
                        className="w-full max-w-sm rounded-lg bg-panel p-5 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-snap-title"
                    >
                        <h2 id="delete-snap-title" className="text-base font-bold text-ink">스냅 삭제</h2>
                        <p className="mt-2 text-sm text-sub">정말 이 스냅을 삭제하시겠어요?</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                className="h-9 rounded-md px-3 text-sm text-sub hover:bg-surface"
                                onClick={() => setDeleteConfirmOpen(false)}
                                disabled={menuLoading}
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                className="h-9 rounded-md bg-danger px-3 text-sm font-medium text-on-danger disabled:opacity-50"
                                onClick={() => void handleDeleteSnap()}
                                disabled={menuLoading}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteCommentTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="presentation">
                    <div
                        className="w-full max-w-sm rounded-lg bg-panel p-5 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-comment-title"
                    >
                        <h2 id="delete-comment-title" className="text-base font-bold text-ink">댓글 삭제</h2>
                        <p className="mt-2 text-sm text-sub">정말 이 댓글을 삭제하시겠어요?</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                className="h-9 rounded-md px-3 text-sm text-sub hover:bg-surface"
                                onClick={() => setDeleteCommentTarget(null)}
                                disabled={deleteCommentLoading}
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                className="h-9 rounded-md bg-danger px-3 text-sm font-medium text-on-danger disabled:opacity-50"
                                onClick={() => deleteCommentTarget && void handleDeleteComment(deleteCommentTarget)}
                                disabled={deleteCommentLoading}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reportTarget && (
                <>
                    <button
                        type="button"
                        aria-label="신고 시트 닫기"
                        className="fixed inset-0 bg-black/40 z-40"
                        onClick={handleCloseReportSheet}
                    />
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto w-full md:w-auto md:max-w-[760px]">
                            <div className="relative bg-panel border border-line shadow-2xl rounded-t-3xl md:rounded-2xl mx-auto w-full max-w-[720px] md:min-w-[640px] md:max-w-[760px] md:max-h-[82vh] md:overflow-y-auto">
                                <button
                                    type="button"
                                    aria-label="신고 모달 닫기"
                                    onClick={handleCloseReportSheet}
                                    className="absolute top-3 right-3 h-8 w-8 rounded-full text-muted hover:bg-surface hover:text-ink flex items-center justify-center"
                                >
                                    ×
                                </button>
                                <div className="w-12 h-1.5 rounded-full bg-line mx-auto mt-3 mb-3 md:hidden" />
                                {!selectedReportReason ? (
                                    <div className="pt-4 pb-6">
                                        <h3 className="text-center text-lg font-bold text-ink mb-2">신고하기</h3>
                                        <div className="mt-2 border-t border-line">
                                            {REPORT_REASONS.map((reason) => (
                                                <button
                                                    key={reason.id}
                                                    type="button"
                                                    onClick={() => setSelectedReportReason(reason)}
                                                    className="w-full h-14 px-6 flex items-center justify-between text-base text-ink hover:bg-surface border-b border-line"
                                                >
                                                    <span>{reason.label}</span>
                                                    <ChevronRightIcon size={16} className="text-muted" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-5 pt-4 pb-6">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (reportSubmitting) return
                                                    setSelectedReportReason(null)
                                                    setReportError('')
                                                }}
                                                className="h-8 w-8 rounded-full hover:bg-surface flex items-center justify-center"
                                                aria-label="사유 목록으로 돌아가기"
                                            >
                                                <ChevronLeftIcon size={16} />
                                            </button>
                                            <h3 className="text-base font-bold text-ink">
                                                {selectedReportReason.label}로 신고하기
                                            </h3>
                                        </div>

                                        <p className="mt-5 text-sm text-ink font-medium">{reportTarget?.username} 님 신고하기</p>
                                        <p className="mt-1 text-xs text-muted">{selectedReportReason.detail}</p>

                                        <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5">
                                            <div>
                                                <p className="text-sm text-ink font-medium">작성자 차단하기</p>
                                                <p className="text-xs text-muted mt-0.5">신고와 함께 작성자를 차단합니다.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setReportBlockUser((prev) => !prev)}
                                                className={`relative w-10 h-6 rounded-full transition-colors ${
                                                    reportBlockUser ? 'bg-brand' : 'bg-line'
                                                }`}
                                                aria-label="작성자 차단 여부"
                                            >
                                                <span
                                                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-on-media shadow transition-transform ${
                                                        reportBlockUser ? 'translate-x-4' : 'translate-x-0.5'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {reportError && <p className="mt-2 text-xs text-danger">{reportError}</p>}

                                        <button
                                            type="button"
                                            onClick={() => void handleSubmitReport()}
                                            disabled={reportSubmitting}
                                            className="mt-5 w-full h-11 rounded-xl bg-brand text-on-brand text-base font-bold hover:brightness-95 disabled:opacity-60"
                                        >
                                            {reportSubmitting ? '신고 접수 중...' : '신고하기'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

type CommentRowProps = {
    comment: SnapFeedComment
    isMine: boolean
    onDelete: () => void
    onReport: () => void
}

const CommentRow: React.FC<CommentRowProps> = ({ comment, isMine, onDelete, onReport }) => {
    const username = (comment as any).username ?? '알 수 없음'
    const content = (comment as any).content ?? (comment as any).comment ?? ''
    const createdAt = (comment as any).createdAt
    const date = createdAt
        ? new Date(createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
        : ''
    const imageCandidates = getImageCandidates(comment.profileKey)
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)

    const MENU_WIDTH = 128

    const openMenu = () => {
        const rect = buttonRef.current?.getBoundingClientRect()
        if (rect) {
            setMenuPosition({
                top: rect.bottom + 4,
                left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
            })
        }
        setMenuOpen(true)
    }

    // 댓글 목록이 스크롤 영역(overflow-y-auto) 안에 있어서, absolute 드롭다운은 그 영역 경계에 잘려
    // "스크롤해야 버튼이 보이는" 현상이 생긴다. 그래서 메뉴를 portal로 body에 fixed 위치로 띄운다.
    useEffect(() => {
        if (!menuOpen) return
        const close = () => setMenuOpen(false)
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node
            if (
                menuRef.current && !menuRef.current.contains(target) &&
                buttonRef.current && !buttonRef.current.contains(target)
            ) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', onPointerDown)
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [menuOpen])

    return (
        <div className="flex items-start gap-2.5">
            {imageCandidates.length > 0 ? (
                <img
                    src={imageCandidates[0]}
                    alt={`${username} 프로필`}
                    width={28}
                    height={28}
                    loading="lazy"
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    onError={(e) => applyNextImageCandidate(e.currentTarget, imageCandidates)}
                />
            ) : (
                <span className="w-7 h-7 rounded-full bg-placeholder shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <p className="text-sm font-bold text-ink">{username}</p>
                    {date && <span className="text-xs text-muted">{date}</span>}
                </div>
                <p className="text-sm text-sub mt-0.5 break-words">{content}</p>
            </div>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted hover:bg-surface hover:text-ink shrink-0"
                aria-label="댓글 메뉴"
            >
                <MoreIcon size={14} />
            </button>
            {menuOpen && menuPosition && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left, width: MENU_WIDTH }}
                    className="z-50 rounded-xl border border-line bg-panel shadow-lg p-1.5"
                >
                    {isMine && (
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false)
                                onDelete()
                            }}
                            className="w-full h-8 rounded-lg px-3 text-left text-sm text-danger hover:bg-danger/10"
                        >
                            삭제
                        </button>
                    )}
                    {!isMine && (
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false)
                                onReport()
                            }}
                            className="w-full h-8 rounded-lg px-3 text-left text-sm text-ink hover:bg-surface"
                        >
                            신고
                        </button>
                    )}
                </div>,
                document.body,
            )}
        </div>
    )
}

export default SnapDetailPage
