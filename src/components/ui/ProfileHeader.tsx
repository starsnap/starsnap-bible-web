import React from 'react'
import { applyNextImageCandidate, getImageCandidates } from '../../utils/s3Image'

export type Stat = { value: string; label: string }
export type Action = {
    label: string
    variant: 'primary' | 'outline'
    onClick?: () => void
}

type Props = {
    name: string
    lines?: React.ReactNode[]
    stats?: Stat[]
    actions: Action[]
    actionMenu?: React.ReactNode
    imageKey?: string | null
}

const ProfileHeader: React.FC<Props> = ({ name, lines = [], stats = [], actions, actionMenu, imageKey }) => {
    const imageCandidates = getImageCandidates(imageKey)

    return (
        <div className="bg-panel border border-line rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                {imageCandidates.length > 0 ? (
                    <img
                        src={imageCandidates[0]}
                        alt={`${name} 프로필`}
                        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full object-cover shrink-0"
                        onError={(e) => applyNextImageCandidate(e.currentTarget, imageCandidates)}
                    />
                ) : (
                    <span className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-placeholder shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-ink truncate">{name}</h1>
                            {lines.map((line, i) => (
                                <p key={i} className="mt-1 text-sm text-sub">
                                    {line}
                                </p>
                            ))}
                        </div>

                        {stats.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:gap-8 pt-1 shrink-0">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="text-center">
                                        <div className="text-lg font-bold text-ink">{stat.value}</div>
                                        <div className="text-xs text-muted mt-0.5">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                        {actions.map((action) => (
                            <button
                                key={action.label}
                                onClick={action.onClick}
                                className={`min-h-11 px-5 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto ${
                                    action.variant === 'primary'
                                        ? 'bg-brand text-on-brand hover:brightness-95'
                                        : 'bg-panel text-ink border border-line hover:bg-surface'
                                }`}
                            >
                                {action.label}
                            </button>
                        ))}
                        {actionMenu && <div className="w-full sm:w-auto sm:ml-auto">{actionMenu}</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfileHeader
