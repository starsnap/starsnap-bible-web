import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { FiBookOpen, FiLogOut } from 'react-icons/fi'
import AuthAxios from '../../lib/axios/AuthAxios'
import './bible.css'

const BibleLayout = () => {
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)
    const [logoutError, setLogoutError] = useState('')
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
        setLoggingOut(true)
        setLogoutError('')

        try {
            await AuthAxios.post('bible/auth/logout')
            setHasUnsavedChanges(false)
            navigate('/login', { replace: true })
        } catch {
            setLogoutError('로그아웃하지 못했습니다. 잠시 후 다시 시도해주세요.')
        } finally {
            setLoggingOut(false)
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
                        {logoutError ? <span className="bible-header__logout-error" role="alert">{logoutError}</span> : null}
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
