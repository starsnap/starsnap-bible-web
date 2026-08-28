import React, { useRef } from 'react'

type Props = {
    items: string[]
    active: string
    onChange: (value: string) => void
}

const CategoryChips: React.FC<Props> = ({ items, active, onChange }) => {
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

    const moveFocus = (currentIndex: number, direction: number) => {
        const nextIndex = (currentIndex + direction + items.length) % items.length
        onChange(items[nextIndex])
        tabRefs.current[nextIndex]?.focus()
    }

    return (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="검색 카테고리">
            {items.map((item, index) => {
                const isActive = item === active
                return (
                    <button
                        ref={(element) => { tabRefs.current[index] = element }}
                        key={item}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onChange(item)}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowRight') moveFocus(index, 1)
                            else if (event.key === 'ArrowLeft') moveFocus(index, -1)
                            else if (event.key === 'Home') moveFocus(index, -index)
                            else if (event.key === 'End') moveFocus(index, items.length - index - 1)
                            else return
                            event.preventDefault()
                        }}
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
