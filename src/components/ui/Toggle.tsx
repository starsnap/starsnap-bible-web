import React from 'react'

type Props = {
    ariaLabel: string
    checked: boolean
    onChange: (value: boolean) => void
    disabled?: boolean
}

const Toggle: React.FC<Props> = ({ ariaLabel, checked, onChange, disabled = false }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-label={ariaLabel}
            aria-checked={checked}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative h-11 w-11 shrink-0 rounded-xl ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
            <span
                aria-hidden
                className={`absolute left-0 top-1/2 h-6 w-11 -translate-y-1/2 rounded-full border border-line-strong transition-colors ${
                    checked ? 'bg-brand' : 'bg-line-strong'
                }`}
            >
                <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow transition-transform ${
                        checked ? 'translate-x-5 bg-on-brand' : 'bg-on-media'
                    }`}
                />
            </span>
        </button>
    )
}

export default Toggle
