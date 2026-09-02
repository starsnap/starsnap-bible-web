import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from "../pages/auth/LoginPage";
import BibleLayout from '../pages/bible/BibleLayout';
import BiblePage from '../pages/bible/BiblePage';
import BibleSignupPage from '../pages/bible/BibleSignupPage';
import AuthAxios from '../lib/axios/AuthAxios';

const RequireBibleSession = () => {
    const [status, setStatus] = useState<'loading' | 'authenticated' | 'signed-out'>('loading')

    useEffect(() => {
        const controller = new AbortController()
        void AuthAxios.get('bible/auth/session', { signal: controller.signal })
            .then(() => setStatus('authenticated'))
            .catch(() => {
                if (!controller.signal.aborted) setStatus('signed-out')
            })
        return () => controller.abort()
    }, [])

    if (status === 'loading') return <main className="bible-session-loading" role="status">로그인 상태를 확인하고 있습니다…</main>
    if (status === 'signed-out') return <Navigate to="/login" replace />
    return <Outlet />
}

const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireBibleSession/>}>
                    <Route path="/" element={<BibleLayout/>}>
                        <Route index element={<BiblePage/>} />
                    </Route>
                </Route>
                <Route path="/login" element={<LoginPage/>} />
                <Route path="/signup" element={<BibleSignupPage/>} />
                <Route path="*" element={<Navigate to="/" replace/>} />
            </Routes>
        </BrowserRouter>
    )
}


export default Router;
