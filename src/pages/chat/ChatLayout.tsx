import React, { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { FiExternalLink, FiLogOut } from 'react-icons/fi'
import CustomAxios from '../../lib/axios/CustomAxios'
import { getSocialAppUrl } from '../../lib/appSurface'
import { queryClient } from '../../lib/query/queryClient'
import token from '../../lib/token/token'

const ChatLayout: React.FC = () => {
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        const previousTitle = document.title
        document.title = 'StarSnap Chat'
        return () => {
            document.title = previousTitle
        }
    }, [])

    const handleLogout = async () => {
        if (loggingOut) return
        setLoggingOut(true)

        try {
            await CustomAxios.post('auth/logout')
        } catch (error) {
            console.warn('[auth] 서버 로그아웃 요청 실패', error)
        } finally {
            queryClient.clear()
            token.clear()
            navigate('/login', { replace: true })
        }
    }

    return (
        <div data-app-surface="chat" className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-surface text-ink">
            <a
                href="#chat-content"
                className="fixed left-4 top-3 z-50 inline-flex min-h-11 -translate-y-20 items-center rounded-lg bg-emphasis px-4 py-2 text-sm font-bold text-on-emphasis focus:translate-y-0"
            >
                메시지로 건너뛰기
            </a>

            <header className="z-30 h-16 shrink-0 border-b border-line bg-[var(--ss-header-bg)] shadow-[var(--ss-shadow-sm)] backdrop-blur-xl">
                <div className="mx-auto flex h-full w-full items-center gap-2 px-3 sm:gap-4 sm:px-6">
                    <Link
                        to="/"
                        className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl px-1.5 hover:bg-panel-hover focus-visible:ring-2 focus-visible:ring-brand"
                        aria-label="StarSnap Chat 홈"
                    >
                        <span className="relative shrink-0">
                            <img
                                src="/icon-96.png"
                                alt=""
                                aria-hidden="true"
                                width={96}
                                height={96}
                                className="h-9 w-9 rounded-xl object-cover"
                            />
                            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-panel bg-brand" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 leading-tight">
                            <span className="block truncate text-base font-bold tracking-tight sm:text-lg">StarSnap Chat</span>
                            <span className="hidden text-xs font-medium text-muted sm:block">메시지 전용</span>
                        </span>
                    </Link>

                    <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                        <a
                            href={getSocialAppUrl('/')}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-sub hover:bg-panel-hover hover:text-ink sm:px-3"
                            aria-label="StarSnap SNS로 이동"
                        >
                            <span className="sm:hidden">SNS</span>
                            <span className="hidden sm:inline">SNS로 이동</span>
                            <FiExternalLink size={16} aria-hidden="true" />
                        </a>
                        <button
                            type="button"
                            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-sub hover:bg-panel-hover hover:text-ink sm:px-3"
                            onClick={() => void handleLogout()}
                            disabled={loggingOut}
                            aria-label={loggingOut ? '로그아웃 중' : '로그아웃'}
                        >
                            <FiLogOut size={17} aria-hidden="true" />
                            <span className="hidden md:inline">{loggingOut ? '로그아웃 중' : '로그아웃'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main
                id="chat-content"
                tabIndex={-1}
                className="min-h-0 flex-1 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
            >
                <Outlet />
            </main>
        </div>
    )
}

export default ChatLayout
