import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',')

let openDialogCount = 0
let previousBodyOverflow = ''

const lockBodyScroll = () => {
    if (openDialogCount === 0) {
        previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
    }
    openDialogCount += 1
}

const unlockBodyScroll = () => {
    openDialogCount = Math.max(0, openDialogCount - 1)
    if (openDialogCount === 0) document.body.style.overflow = previousBodyOverflow
}

export const useAccessibleDialog = (isOpen: boolean, onClose: () => void) => {
    const dialogRef = useRef<HTMLDivElement>(null)
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    useEffect(() => {
        if (!isOpen) return

        const dialog = dialogRef.current
        if (!dialog) return

        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null
        lockBodyScroll()

        const getFocusableElements = () => Array.from(
            dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((element) => element.getAttribute('aria-hidden') !== 'true')

        const initialFocus = dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]')
            ?? getFocusableElements()[0]
            ?? dialog
        const focusFrame = window.requestAnimationFrame(() => initialFocus.focus({ preventScroll: true }))

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onCloseRef.current()
                return
            }
            if (event.key !== 'Tab') return

            const focusableElements = getFocusableElements()
            if (focusableElements.length === 0) {
                event.preventDefault()
                dialog.focus({ preventScroll: true })
                return
            }

            const first = focusableElements[0]
            const last = focusableElements[focusableElements.length - 1]
            const activeElement = document.activeElement
            if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
                event.preventDefault()
                last.focus({ preventScroll: true })
            } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
                event.preventDefault()
                first.focus({ preventScroll: true })
            }
        }

        document.addEventListener('keydown', handleKeyDown, true)
        return () => {
            window.cancelAnimationFrame(focusFrame)
            document.removeEventListener('keydown', handleKeyDown, true)
            unlockBodyScroll()
            if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true })
        }
    }, [isOpen])

    return dialogRef
}
