import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import {
    THEME_STORAGE_KEY,
    applyTheme,
    getAppliedTheme,
    getStoredTheme,
    persistTheme,
    resolveTheme,
    type ColorTheme,
} from '../../lib/theme/theme'

type ThemeContextValue = {
    theme: ColorTheme
    isDark: boolean
    setTheme: (theme: ColorTheme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = {
    children: ReactNode
    initialTheme?: ColorTheme
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme }) => {
    const [theme, setThemeState] = useState<ColorTheme>(() => initialTheme ?? getAppliedTheme())

    const setTheme = useCallback((nextTheme: ColorTheme) => {
        applyTheme(nextTheme)
        persistTheme(nextTheme)
        setThemeState(nextTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }, [setTheme, theme])

    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== THEME_STORAGE_KEY) return
            const nextTheme = resolveTheme()
            applyTheme(nextTheme)
            setThemeState(nextTheme)
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const onSystemThemeChange = () => {
            if (getStoredTheme()) return
            const nextTheme = resolveTheme()
            applyTheme(nextTheme)
            setThemeState(nextTheme)
        }

        window.addEventListener('storage', onStorage)
        mediaQuery.addEventListener('change', onSystemThemeChange)

        return () => {
            window.removeEventListener('storage', onStorage)
            mediaQuery.removeEventListener('change', onSystemThemeChange)
        }
    }, [])

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
    }), [setTheme, theme, toggleTheme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme must be used inside ThemeProvider')
    return context
}
