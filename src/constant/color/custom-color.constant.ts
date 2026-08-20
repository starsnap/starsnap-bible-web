import { designTokens } from '../../styles/designTokens'

/** @deprecated Prefer designTokens in new code. */
export const CustomColor = {
    white: designTokens.color.surface,
    overlay_50: 'var(--ss-overlay)',
    yellow_50: 'var(--ss-yellow-50)',
    yellow_100: 'var(--ss-yellow-100)',
    yellow_200: 'var(--ss-yellow-200)',
    yellow_300: 'var(--ss-yellow-300)',
    yellow_400: designTokens.color.brand,
    yellow_500: designTokens.color.brandHover,
    yellow_600: designTokens.color.brandActive,
    yellow_700: 'var(--ss-yellow-700)',
    yellow_800: 'var(--ss-yellow-800)',
    yellow_900: 'var(--ss-yellow-800)',
    light_black: designTokens.color.text,
    title: designTokens.color.textSoft,
    sub_title: designTokens.color.textSubtle,
    gray: designTokens.color.textMuted,
    light_gray: 'var(--ss-neutral-300)',
    button: designTokens.color.borderStrong,
    container: designTokens.color.surfaceSubtle,
    error: designTokens.color.danger,
    success: designTokens.color.success,
} as const;

export const CustomFontSize = {
    caption: designTokens.typography.size.xs,
    label: designTokens.typography.size.sm,
} as const
