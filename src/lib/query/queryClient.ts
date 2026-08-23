import { QueryCache, QueryClient, MutationCache } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import token from '../token/token'

function getErrorStatus(error: unknown): number | undefined {
    const axiosError = error as AxiosError | undefined
    return axiosError?.response?.status
}

function isUnauthenticatedError(error: unknown): boolean {
    const status = getErrorStatus(error)
    return status === 401
}

function redirectToLoginIfNeeded() {
    token.clear()

    if (typeof window === 'undefined') return
    if (window.location.pathname === '/login') return

    window.location.replace('/login')
}

export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => {
            if (isUnauthenticatedError(error)) {
                redirectToLoginIfNeeded()
            }
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            if (isUnauthenticatedError(error)) {
                redirectToLoginIfNeeded()
            }
        },
    }),
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            cacheTime: 10 * 60 * 1000,
            retry: (failureCount, error) => {
                if (isUnauthenticatedError(error)) return false
                return failureCount < 1
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
})
