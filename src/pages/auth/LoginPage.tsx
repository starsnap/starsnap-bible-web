import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAxios from '../../lib/axios/CustomAxios';
import { queryClient } from '../../lib/query/queryClient';
import token from '../../lib/token/token';

const LoginPage: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const isEnabled = identifier.trim() !== '' && password.trim() !== '' && !loading;

    const handleLogin = async () => {
        if (!isEnabled) return;
        setErrorMessage('');
        setLoading(true);
        try {
            const loginType = identifier.includes('@') ? 'EMAIL' : 'USERNAME';
            const resp = await CustomAxios.post('auth/login', {
                username: identifier,
                password: password,
                loginType,
            });

            if (resp.status === 200 && resp.data) {
                queryClient.clear();
                token.markAuthenticated();
                navigate('/');
            } else {
                setErrorMessage('로그인에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (err: any) {
            console.error('login error', err);
            const status = err?.response?.status;
            if (typeof status === 'number' && status >= 400 && status < 500) {
                setErrorMessage('아이디 또는 비밀번호를 확인해주세요.');
            } else {
                setErrorMessage('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void handleLogin();
    };

    const inputClass =
        'w-full h-12 rounded-xl border border-line bg-panel px-4 text-sm text-ink placeholder:text-muted hover:border-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';

    return (
        <div
            className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10"
            style={{
                background: 'radial-gradient(circle at 18% 14%, var(--ss-brand-soft) 0, transparent 30%), radial-gradient(circle at 86% 86%, var(--ss-border) 0, transparent 34%), var(--ss-canvas)',
            }}
        >
            <div className="w-full max-w-[400px] bg-panel rounded-[24px] border border-line shadow-[var(--ss-shadow-md)] px-6 py-8 sm:px-9 sm:py-10">
                <div className="text-center">
                    <h1 className="flex items-center justify-center gap-2.5 text-2xl font-extrabold tracking-tight text-ink">
                        <img
                            src="/icon-96.png"
                            alt=""
                            aria-hidden="true"
                            width={96}
                            height={96}
                            className="h-10 w-10 shrink-0 rounded-xl object-cover"
                        />
                        StarSnap
                    </h1>
                    <p className="mt-2 text-sm text-sub">좋아하는 스타의 순간을 한곳에 모아보세요</p>
                </div>

                <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit} autoComplete="off">
                    <div>
                        <label htmlFor="login-identifier" className="block text-sm font-bold text-ink mb-1.5">아이디 또는 이메일</label>
                        <input
                            id="login-identifier"
                            className={inputClass}
                            name="identifier"
                            type="text"
                            placeholder="아이디 또는 이메일을 입력해주세요"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            autoComplete="username"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-sm font-bold text-ink mb-1.5">비밀번호</label>
                        <input
                            id="login-password"
                            className={inputClass}
                            name="password"
                            placeholder="비밀번호"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            autoComplete="current-password"
                        />
                    </div>

                    {errorMessage && <p className="text-sm text-danger" role="alert">{errorMessage}</p>}

                    <button
                        type="submit"
                        className="h-12 rounded-xl mt-1 font-bold text-on-brand bg-brand shadow-sm hover:brightness-95"
                        disabled={!isEnabled}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>

                    <div className="flex min-h-11 items-center justify-center text-center text-sm text-sub">
                        아직 계정이 없으신가요?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            className="min-h-11 rounded-lg px-1.5 font-bold text-ink underline decoration-brand decoration-2 underline-offset-4"
                        >
                            회원가입
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
