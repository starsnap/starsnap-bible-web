import React from 'react'

type Props = {
    items: string[]
    active: string
    onChange: (value: string) => void
}

const CategoryChips: React.FC<Props> = ({ items, active, onChange }) => {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => {
                const isActive = item === active
                return (
                    <button
                        key={item}
                        onClick={() => onChange(item)}
                        className={`min-h-11 px-4 rounded-full text-sm font-medium transition-colors border ${
                            isActive
                                ? 'bg-emphasis text-on-emphasis border-emphasis'
                                : 'bg-panel text-sub border-line hover:bg-surface'
                        }`}
                    >
                        {item}
                    </button>
                )
            })}
        </div>
    )
}

export default CategoryChips
