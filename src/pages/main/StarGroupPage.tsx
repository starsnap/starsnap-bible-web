import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchStarGroups, type StarGroupSearchItem } from '../../services/snapService'
import { applyNextImageCandidate, getImageCandidates } from '../../utils/s3Image'
import { queryKeys } from '../../services/queryKeys'
import { StarGroupListSkeleton } from '../../components/ui/EntitySkeletons'

const StarGroupPage: React.FC = () => {
    const navigate = useNavigate()
    const groupsQuery = useQuery({
        queryKey: queryKeys.starGroups('', 0, 48),
        queryFn: () => searchStarGroups('', 0, 48),
    })
    const groups: StarGroupSearchItem[] = groupsQuery.data ?? []
    const loading = groupsQuery.isLoading

    return (
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-ink">스타그룹</h1>
                <p className="mt-1 text-sm text-sub">관심 있는 그룹을 선택해 페이지로 이동하세요.</p>
            </div>

            {loading ? (
                <StarGroupListSkeleton />
            ) : groups.length === 0 ? (
                <p className="text-sm text-sub">표시할 스타그룹이 없습니다.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {groups.map((group) => {
                        const imageCandidates = getImageCandidates(group.imageKey)

                        return (
                        <button
                            key={group.id}
                            onClick={() => navigate(`/stargroup/${group.id}`)}
                            className="text-left rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition group relative h-48"
                        >
                            {/* 배경 이미지 */}
                            {imageCandidates.length > 0 ? (
                                <img
                                    src={imageCandidates[0]}
                                    alt={`${group.name} 프로필`}
                                    className="w-full h-full object-cover absolute inset-0"
                                    onError={(e) => applyNextImageCandidate(e.currentTarget, imageCandidates)}
                                />
                            ) : (
                                <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-muted to-sub" />
                            )}

                            {/* 어두운 오버레이 */}
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />

                            {/* 정보 오버레이 */}
                            <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                                <div className="space-y-1">
                                    <p className="text-lg font-bold truncate leading-tight">{group.name}</p>
                                    <p className="text-xs text-white/75">
                                        데뷔 {group.debutDate || '-'}
                                    </p>
                                </div>
                            </div>
                        </button>
                        )})}
                </div>
            )}
        </div>
    )
}

export default StarGroupPage
