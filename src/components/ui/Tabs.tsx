import React, { useRef } from 'react'

type Props = {
    items: string[]
    active: string
    onChange: (value: string) => void
}

const Tabs: React.FC<Props> = ({ items, active, onChange }) => {
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

    const moveFocus = (currentIndex: number, direction: number) => {
        const nextIndex = (currentIndex + direction + items.length) % items.length
        onChange(items[nextIndex])
        tabRefs.current[nextIndex]?.focus()
    }

    return (
        <div className="border-b border-line overflow-x-auto">
            <div className="flex items-center gap-6 sm:gap-7 min-w-max" role="tablist">
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
                            className={`relative flex min-h-11 items-center px-1 text-sm sm:text-body-sm whitespace-nowrap transition-colors ${
                                isActive ? 'text-ink font-bold' : 'text-muted hover:text-sub'
                            }`}
                        >
                            {item}
                            {isActive && (
                                <span className="absolute left-0 -bottom-px h-0.5 w-full bg-ink rounded-full" aria-hidden="true" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default Tabs
