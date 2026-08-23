import React from 'react'

const skeletonItems = Array.from({ length: 9 })

export const StarListSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {skeletonItems.map((_, index) => (
            <div
                key={index}
                className="rounded-2xl border border-line bg-panel p-5 animate-pulse"
                aria-hidden="true"
            >
                <div className="flex items-center gap-4">
                    <span className="h-14 w-14 shrink-0 rounded-full bg-placeholder" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <span className="block h-5 w-2/5 rounded bg-placeholder" />
                        <span className="block h-3.5 w-3/5 rounded bg-placeholder" />
                    </div>
                </div>
                <span className="mt-4 block h-3 w-1/3 rounded bg-placeholder" />
            </div>
        ))}
    </div>
)

export const StarGroupListSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {skeletonItems.map((_, index) => (
            <div
                key={index}
                className="relative h-48 overflow-hidden rounded-2xl bg-placeholder animate-pulse"
                aria-hidden="true"
            >
                <div className="absolute inset-x-4 bottom-4 space-y-2">
                    <span className="block h-5 w-2/5 rounded bg-on-media/60" />
                    <span className="block h-3 w-1/3 rounded bg-on-media/45" />
                </div>
            </div>
        ))}
    </div>
)

export const EntityProfileHeaderSkeleton: React.FC = () => (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-6 animate-pulse" aria-busy="true">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <span className="h-20 w-20 shrink-0 rounded-full bg-placeholder sm:h-24 sm:w-24 lg:h-28 lg:w-28" />
            <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:gap-6">
                    <div className="space-y-2">
                        <span className="block h-7 w-40 rounded bg-placeholder" />
                        <span className="block h-4 w-28 rounded bg-placeholder" />
                        <span className="block h-4 w-24 rounded bg-placeholder" />
                    </div>
                    <div className="grid grid-cols-3 gap-5 pt-1 sm:gap-8">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="space-y-1.5 text-center">
                                <span className="mx-auto block h-5 w-8 rounded bg-placeholder" />
                                <span className="mx-auto block h-3 w-10 rounded bg-placeholder" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <span className="h-10 w-24 rounded-lg bg-placeholder" />
                    <span className="h-10 w-16 rounded-lg bg-placeholder" />
                </div>
            </div>
        </div>
    </div>
)

export const StarGroupHeaderSkeleton: React.FC = () => (
    <div className="rounded-2xl bg-placeholder p-7 animate-pulse" aria-busy="true">
        <div className="flex items-center gap-6">
            <span className="h-28 w-28 shrink-0 rounded-full border-4 border-on-media/70 bg-on-media/30" />
            <div className="flex-1 space-y-3">
                <span className="block h-8 w-40 rounded bg-on-media/60" />
                <span className="block h-4 w-24 rounded bg-on-media/45" />
            </div>
        </div>
        <div className="mt-6 flex gap-2">
            <span className="h-10 flex-1 rounded-lg bg-on-media/60" />
            <span className="h-10 w-10 rounded-lg bg-on-media/60" />
            <span className="h-10 w-10 rounded-lg bg-on-media/60" />
        </div>
    </div>
)
