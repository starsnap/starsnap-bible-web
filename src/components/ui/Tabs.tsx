import React from 'react'

type Props = {
    items: string[]
    active: string
    onChange: (value: string) => void
}

const Tabs: React.FC<Props> = ({ items, active, onChange }) => {
    return (
        <div className="border-b border-line overflow-x-auto">
            <div className="flex items-center gap-6 sm:gap-7 min-w-max">
                {items.map((item) => {
                    const isActive = item === active
                    return (
                        <button
                            key={item}
                            onClick={() => onChange(item)}
                            className={`relative pb-3 text-sm sm:text-body-sm whitespace-nowrap transition-colors ${
                                isActive ? 'text-ink font-bold' : 'text-muted hover:text-sub'
                            }`}
                        >
                            {item}
                            {isActive && (
                                <span className="absolute left-0 -bottom-px h-0.5 w-full bg-ink rounded-full" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default Tabs
