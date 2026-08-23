import React from 'react'
import SnapCard from './SnapCard'
import { getFallbackAspectRatio, type Snap } from '../../constant/mock/snaps'

type Props = {
    snaps: Snap[]
    showAuthor?: boolean
    /** tailwind columns classes for responsive masonry */
    columnsClass?: string
    onSnapClick?: (snap: Snap) => void
    isLoading?: boolean
}

const SKELETON_COUNT = 10

const SnapCardSkeleton: React.FC<{ aspectRatio: number; showAuthor: boolean }> = ({ aspectRatio, showAuthor }) => (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel" aria-hidden="true">
        <div className="animate-pulse">
            <div className="bg-placeholder" style={{ aspectRatio }} />
            {showAuthor && (
                <div className="flex items-center gap-2 px-3 py-2.5">
                    <span className="h-6 w-6 shrink-0 rounded-full bg-placeholder" />
                    <span className="h-3 w-20 rounded bg-placeholder" />
                </div>
            )}
        </div>
    </div>
)

const MasonryGrid: React.FC<Props> = ({
    snaps,
    showAuthor = true,
    columnsClass = 'columns-2 md:columns-3 xl:columns-5 2xl:columns-6',
    onSnapClick,
    isLoading = false,
}) => {
    return (
        <div className={`snap-masonry ${columnsClass}`} aria-busy={isLoading}>
            {isLoading
                ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                      <SnapCardSkeleton key={index} aspectRatio={getFallbackAspectRatio(index)} showAuthor={showAuthor} />
                  ))
                : snaps.map((snap) => (
                      <SnapCard
                          key={snap.id}
                          snap={snap}
                          showAuthor={showAuthor}
                          onClick={onSnapClick ? () => onSnapClick(snap) : undefined}
                      />
                  ))}
        </div>
    )
}

export default MasonryGrid
