export type ColorTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'starsnap-theme'

const isColorTheme = (value: string | null): value is ColorTheme =>
    value === 'light' || value === 'dark'

export const getStoredTheme = (): ColorTheme | null => {
    if (typeof window === 'undefined') return null

    try {
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
        return isColorTheme(storedTheme) ? storedTheme : null
    } catch {
        return null
    }
}

export const getSystemTheme = (): ColorTheme => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const resolveTheme = (): ColorTheme => getStoredTheme() ?? getSystemTheme()

const updateThemeColor = () => {
    if (typeof document === 'undefined') return

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!themeColor) return

    const probe = document.createElement('span')
    probe.style.color = 'var(--ss-canvas)'
    probe.style.display = 'none'
    document.documentElement.appendChild(probe)
    const tokenColor = window.getComputedStyle(probe).color.trim()
    probe.remove()

    if (tokenColor) themeColor.content = tokenColor
}

export const applyTheme = (theme: ColorTheme) => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.dataset.theme = theme
    root.style.colorScheme = theme
    updateThemeColor()
}

export const persistTheme = (theme: ColorTheme) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
        // The visual theme still works when storage is unavailable.
    }
}

export const getAppliedTheme = (): ColorTheme => {
    if (typeof document === 'undefined') return resolveTheme()
    const appliedTheme = document.documentElement.dataset.theme ?? null
    return isColorTheme(appliedTheme) ? appliedTheme : resolveTheme()
}

export const initializeTheme = (): ColorTheme => {
    const theme = resolveTheme()
    applyTheme(theme)
    return theme
}
