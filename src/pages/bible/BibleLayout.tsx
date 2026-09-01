import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { FiBookOpen, FiExternalLink, FiLogOut } from 'react-icons/fi'
import CustomAxios from '../../lib/axios/CustomAxios'
import { getSocialAppUrl } from '../../lib/appSurface'
import { queryClient } from '../../lib/query/queryClient'
import token from '../../lib/token/token'
import './bible.css'

const BibleLayout = () => {
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChangesState] = useState(false)
    const hasUnsavedChangesRef = useRef(false)

    const setHasUnsavedChanges = useCallback((value: boolean) => {
        hasUnsavedChangesRef.current = value
        setHasUnsavedChangesState(value)
    }, [])

    useEffect(() => {
        const previousTitle = document.title
        document.title = 'StarSnap Bible'
        return () => {
            document.title = previousTitle
        }
    }, [])

    useEffect(() => {
        const preventAccidentalExit = (event: BeforeUnloadEvent) => {
            if (!hasUnsavedChangesRef.current) return
            event.preventDefault()
            event.returnValue = ''
        }
        window.addEventListener('beforeunload', preventAccidentalExit)
        return () => window.removeEventListener('beforeunload', preventAccidentalExit)
    }, [])

    const handleLogout = async () => {
        if (loggingOut) return
        if (hasUnsavedChanges && !window.confirm('저장하지 않은 묵상이 있습니다. 로그아웃하고 내용을 버릴까요?')) return
        setHasUnsavedChanges(false)
        setLoggingOut(true)

        try {
            await CustomAxios.post('bible/auth/logout')
        } catch (error) {
            console.warn('[auth] 서버 로그아웃 요청 실패', error)
        } finally {
            queryClient.clear()
            token.clear()
            navigate('/login', { replace: true })
        }
    }

    return (
        <div className="bible-shell" data-app-surface="bible">
            <a className="bible-skip-link" href="#bible-content">
                성경 검색과 묵상으로 건너뛰기
            </a>

            <header className="bible-header">
                <div className="bible-header__inner">
                    <Link className="bible-brand" to="/" aria-label="StarSnap Bible 홈">
                        <span className="bible-brand__mark" aria-hidden="true">
                            <FiBookOpen size={22} />
                        </span>
                        <span>
                            <span className="bible-brand__title">StarSnap Bible</span>
                            <span className="bible-brand__subtitle">검색과 비공개 묵상</span>
                        </span>
                    </Link>

                    <nav className="bible-header__actions" aria-label="Bible 보조 메뉴">
                        <a
                            className="bible-header__link"
                            href={getSocialAppUrl('/')}
                            aria-label="SNS로 이동"
                            onClick={(event) => {
                                if (hasUnsavedChanges && !window.confirm('저장하지 않은 묵상이 있습니다. SNS로 이동하고 내용을 버릴까요?')) {
                                    event.preventDefault()
                                } else if (hasUnsavedChanges) {
                                    setHasUnsavedChanges(false)
                                }
                            }}
                        >
                            <span className="bible-header__link-label">SNS로 이동</span>
                            <FiExternalLink size={17} aria-hidden="true" />
                        </a>
                        <button
                            className="bible-header__link"
                            type="button"
                            onClick={() => void handleLogout()}
                            disabled={loggingOut}
                            aria-label={loggingOut ? '로그아웃 중…' : '로그아웃'}
                        >
                            <FiLogOut size={18} aria-hidden="true" />
                            <span className="bible-header__link-label">
                                {loggingOut ? '로그아웃 중…' : '로그아웃'}
                            </span>
                        </button>
                    </nav>
                </div>
            </header>

            <main id="bible-content" className="bible-main" tabIndex={-1}>
                <Outlet context={{ setHasUnsavedChanges }} />
            </main>
        </div>
    )
}

export default BibleLayout

export type BibleLayoutOutletContext = {
    setHasUnsavedChanges: (value: boolean) => void
}
