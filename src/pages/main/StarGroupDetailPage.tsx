import React, { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Tabs from '../../components/ui/Tabs'
import MasonryGrid from '../../components/ui/MasonryGrid'
import { StarGroupHeaderSkeleton } from '../../components/ui/EntitySkeletons'
import { ShareIcon, MoreIcon } from '../../components/icons'
import { getPhotoAspectRatio, type Snap } from '../../constant/mock/snaps'
import {
    getSnapsByStarGroup,
    searchStarGroups,
    type SnapFeedItem,
    type SnapSliceResponse,
    type StarGroupSearchItem,
    searchStars,
    toStarRouteKey,
    type StarSearchItem,
} from '../../services/snapService'
import { applyNextImageCandidate, getImageCandidates } from '../../utils/s3Image'
import { queryKeys } from '../../services/queryKeys'

const tabs = ['스냅', '정보']

const toSnapCard = (item: SnapFeedItem, index: number): Snap => ({
    id: item.snapData.snapId,
    author: item.createdUser.username,
    authorImageKey: item.createdUser.imageKey ?? null,
    aspectRatio: getPhotoAspectRatio(item.snapData.photos?.[0], index),
    photoKey: item.snapData.photos?.[0]?.fileKey,
    liked: !!item.snapData.likeState,
})

const StarGroupDetailPage: React.FC = () => {
    const navigate = useNavigate()
    const { starGroupId } = useParams<{ starGroupId: string }>()
    const [tab, setTab] = useState(tabs[0])
    const groupsQuery = useQuery({
        queryKey: queryKeys.starGroups('', 0, 100),
        queryFn: () => searchStarGroups('', 0, 100),
        enabled: !!starGroupId,
    })

    const group: StarGroupSearchItem | null = useMemo(() => {
        if (!starGroupId) return null
        const groups = groupsQuery.data ?? []
        return groups.find((item) => item.id === starGroupId) ?? null
    }, [starGroupId, groupsQuery.data])

    const membersQuery = useQuery({
        queryKey: queryKeys.stars('', 0, 500),
        queryFn: () => searchStars('', 0, 500),
        enabled: !!group?.id,
    })

    const members: StarSearchItem[] = useMemo(() => {
        if (!group?.id) return []
        const allStars = membersQuery.data ?? []
        return allStars.filter((member) => member.starGroup?.id === group.id)
    }, [group?.id, membersQuery.data])

    const snapsQuery = useQuery({
        queryKey: queryKeys.starGroupSnaps(group?.id ?? '', 0, 0),
        queryFn: async () => {
            if (!group?.id) return []

            const all: SnapSliceResponse['content'] = []
            let page = 0

            while (true) {
                const response = await getSnapsByStarGroup(group.id, page, 100)
                all.push(...response.content)

                if (response.last || response.empty || response.content.length === 0) {
                    break
                }

                page += 1
            }

            return all
        },
        enabled: !!group?.id,
    })

    const snaps = useMemo(() => {
        return (snapsQuery.data ?? []).map(toSnapCard)
    }, [snapsQuery.data])

    const loading = groupsQuery.isLoading || (!!group?.id && membersQuery.isLoading)
    const imageCandidates = getImageCandidates(group?.imageKey)

    if (loading) {
        return (
            <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
                <StarGroupHeaderSkeleton />
            </div>
        )
    }

    if (!group) {
        return <Navigate to="/stargroup" replace />
    }

    return (
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {/* Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-media-backdrop-soft to-media-backdrop p-7">
                <div className="flex items-center gap-6">
                    {imageCandidates.length > 0 ? (
                        <img
                            src={imageCandidates[0]}
                            alt={`${group.name} 프로필`}
                            className="w-28 h-28 rounded-full object-cover border-4 border-on-media/70 shrink-0"
                            onError={(e) => applyNextImageCandidate(e.currentTarget, imageCandidates)}
                        />
                    ) : (
                        <span className="w-28 h-28 rounded-full bg-on-media/30 border-4 border-on-media/70 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 text-on-media">
                        <h1 className="text-3xl font-bold">{group.name}</h1>
                        <p className="mt-1.5 text-sm text-on-media/90">
                            데뷔 {group.debutDate || '-'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button className="h-10 px-5 rounded-lg bg-brand text-on-brand text-sm font-bold hover:brightness-95">
                            팬 추가
                        </button>
                        <button className="w-10 h-10 rounded-lg bg-[var(--ss-surface-translucent)] text-ink flex items-center justify-center hover:bg-panel">
                            <ShareIcon size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-lg bg-[var(--ss-surface-translucent)] text-ink flex items-center justify-center hover:bg-panel">
                            <MoreIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Members */}
            <div className="mt-7">
                <h2 className="text-lg font-bold text-ink mb-4">멤버</h2>
                <div className="flex gap-7 overflow-x-auto pb-2">
                    {members.length > 0 ? (
                        members.map((member) => {
                            const memberImageCandidates = getImageCandidates(member.imageKey)
                            return (
                                <button
                                    key={member.id}
                                    className="flex flex-col items-center gap-2 shrink-0"
                                    onClick={() =>
                                        navigate(`/star/${toStarRouteKey(member)}`, {
                                            state: { star: member },
                                        })
                                    }
                                >
                                    {memberImageCandidates.length > 0 ? (
                                        <img
                                            src={memberImageCandidates[0]}
                                            alt={`${member.name} 프로필`}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-line"
                                            onError={(e) => applyNextImageCandidate(e.currentTarget, memberImageCandidates)}
                                        />
                                    ) : (
                                        <span className="w-16 h-16 rounded-full bg-placeholder" />
                                    )}
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-ink truncate" style={{ maxWidth: '80px' }}>
                                            {member.name}
                                        </p>
                                        {member.nickname && (
                                            <p className="text-xs text-sub truncate" style={{ maxWidth: '80px' }}>
                                                {member.nickname}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            )
                        })
                    ) : (
                        <span className="text-sm text-sub">멤버 정보가 없습니다.</span>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <Tabs items={tabs} active={tab} onChange={setTab} />
            </div>

            <div className="mt-6">
                {tab === '스냅' ? (
                    snapsQuery.isError ? (
                        <p className="text-sm text-danger">스타그룹 스냅을 불러오지 못했습니다.</p>
                    ) : snapsQuery.isLoading ? (
                        <MasonryGrid snaps={[]} showAuthor={false} isLoading />
                    ) : snaps.length === 0 ? (
                        <p className="text-sm text-sub">이 스타그룹에 연결된 스냅이 없습니다.</p>
                    ) : (
                        <MasonryGrid snaps={snaps} showAuthor={false} />
                    )
                ) : (
                    <p className="text-sm text-sub">{group.explanation || '등록된 스타그룹 소개가 없습니다.'}</p>
                )}
            </div>
        </div>
    )
}

export default StarGroupDetailPage
