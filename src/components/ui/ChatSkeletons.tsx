import React from 'react'

export const ChatRoomListSkeleton: React.FC<{ count?: number }> = ({ count = 7 }) => (
    <div role="status" aria-label="대화 목록을 불러오는 중" aria-busy="true">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-3 px-4 py-3" aria-hidden="true">
                <span className="h-11 w-11 shrink-0 rounded-full bg-placeholder" />
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <span className={`h-4 rounded bg-placeholder ${index % 2 === 0 ? 'w-28' : 'w-20'}`} />
                        <span className="h-3 w-9 rounded bg-placeholder" />
                    </div>
                    <span className={`block h-3 rounded bg-placeholder ${index % 3 === 0 ? 'w-4/5' : 'w-3/5'}`} />
                </div>
            </div>
        ))}
    </div>
)

const chatMessageWidths = [48, 64, 40, 72, 56, 44]

export const ChatMessageListSkeleton: React.FC<{ count?: number }> = ({ count = chatMessageWidths.length }) => (
    <div className="space-y-3" role="status" aria-label="메시지를 불러오는 중" aria-busy="true">
        {chatMessageWidths.slice(0, count).map((width, index) => (
            <div
                key={`${width}-${index}`}
                className={`flex animate-pulse ${index % 3 === 1 ? 'justify-end' : 'justify-start'}`}
                aria-hidden="true"
            >
                <span
                    className={`h-10 rounded-2xl bg-placeholder ${index % 3 === 1 ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={{ width: `${width}%` }}
                />
            </div>
        ))}
    </div>
)

export const ChatFriendListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
    <div
        className="mt-2 max-h-44 divide-y divide-line overflow-hidden rounded-md border border-line bg-panel"
        role="status"
        aria-label="친구 목록을 불러오는 중"
        aria-busy="true"
    >
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-2 px-3 py-2" aria-hidden="true">
                <span className="h-7 w-7 shrink-0 rounded-full bg-placeholder" />
                <span className={`h-4 rounded bg-placeholder ${index % 2 === 0 ? 'w-28' : 'w-20'}`} />
            </div>
        ))}
    </div>
)
