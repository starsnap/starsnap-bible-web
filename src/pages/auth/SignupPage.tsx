import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { useEmailCheck } from '../../hooks/useEmailCheck';
import { useUsernameCheck } from '../../hooks/useUsernameCheck';
import { useSignUp } from '../../hooks/useSignUp';
import { sendEmailVerification, verifyEmailCode } from '../../services/api';
import { CheckIcon } from '../../components/icons';
import signupLoadingAnimation from '../../assets/lottie/signup_loading.json';
import signupSuccessAnimation from '../../assets/lottie/signup_success.json';
import signupErrorAnimation from '../../assets/lottie/signup_error.json';

const STEP_META = [
    { key: 'username', label: '아이디', title: ['닉네임으로 사용할', '아이디를 입력해주세요'], hint: '영문 대소문자와 숫자를 조합해 입력할 수 있어요' },
    { key: 'password', label: '비밀번호', title: ['안전한', '비밀번호를 설정해주세요'], hint: '8자 이상, 영문/숫자/특수문자를 조합해주세요' },
    { key: 'email', label: '이메일', title: ['로그인에 사용할', '이메일을 입력해주세요'], hint: '인증 및 계정 찾기에 사용됩니다' },
    { key: 'verify', label: '인증번호', title: ['이메일 확인 후', '인증번호를 입력해주세요'], hint: '메일로 받은 4자리 인증번호를 입력해주세요' },
    { key: 'terms', label: '약관 동의', title: ['거의 다 왔어요!', '약관에 동의해주세요'], hint: '서비스 이용을 위해 동의가 필요합니다' },
] as const;

const inputClass =
    'w-full h-12 rounded-lg border border-line bg-surface px-4 pr-11 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand';

const USERNAME_REGEX = /^[A-Za-z0-9]{4,12}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[~\u2024!@#$%^&*()_\-+=|\\;:\u2018\u201C<>,.?/]).{8,50}$/;

type PasswordState = 'SUCCESS' | 'ERROR' | 'DEFAULT' | 'CONFIRM_EMPTY' | 'INVALID_CONFIRM';
type SignupResultState = 'FORM' | 'LOADING' | 'SUCCESS' | 'ERROR';
type VerifyCodeState = 'DEFAULT' | 'LOADING' | 'SUCCESS' | 'ERROR' | 'RESEND' | 'INTERNET_ERROR';

const VERIFY_CODE_LENGTH = 4;
const VERIFY_EXPIRE_SECONDS = 300;
const VERIFY_RESEND_SECONDS = 60;

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [email, setEmail] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [signupToken, setSignupToken] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptMarketing, setAcceptMarketing] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [resultState, setResultState] = useState<SignupResultState>('FORM');
    const [successNextUrl, setSuccessNextUrl] = useState<string | null>(null);
    const [emailSending, setEmailSending] = useState(false);
    const [emailSendError, setEmailSendError] = useState<string | null>(null);
    const [emailSendRejected, setEmailSendRejected] = useState(false);
    const [emailVerifying, setEmailVerifying] = useState(false);
    const [verifyCodeState, setVerifyCodeState] = useState<VerifyCodeState>('DEFAULT');
    const [verifyTimer, setVerifyTimer] = useState(0);
    const [resendTimer, setResendTimer] = useState(0);
    const emailRef = useRef(email);
    emailRef.current = email;

    const usernameValid = USERNAME_REGEX.test(username);
    const usernameCheck = useUsernameCheck(step === 0 && usernameValid ? username : undefined, { debounceMs: 700 });
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const emailCheck = useEmailCheck(step === 2 && emailValid ? email : undefined, { debounceMs: 500 });
    const { loading, submit } = useSignUp();

    const passwordState = useMemo<PasswordState>(() => {
        const isPasswordValid = PASSWORD_REGEX.test(password);

        if (password.length === 0) return 'DEFAULT';
        if (!isPasswordValid) return 'ERROR';
        if (passwordConfirm.length === 0) return 'CONFIRM_EMPTY';
        if (password !== passwordConfirm) return 'INVALID_CONFIRM';
        return 'SUCCESS';
    }, [password, passwordConfirm]);

    const isVerificationSent = verifyTimer > 0 || resendTimer > 0 || verifyCodeState === 'SUCCESS';
    const isEmailVerified = verifyCodeState === 'SUCCESS' && signupToken.length > 0;
    const emailAvailable = emailValid && emailCheck.available === true && !emailSendRejected;
    const canSendVerification = emailAvailable && resendTimer === 0 && !emailSending && !isEmailVerified;
    const canVerifyCode = verifyCode.length === VERIFY_CODE_LENGTH && verifyTimer > 0 && !emailVerifying && !isEmailVerified;

    const canProceed = (() => {
        switch (step) {
            case 0:
                return usernameValid && usernameCheck.available === true;
            case 1:
                return passwordState === 'SUCCESS';
            case 2:
                return emailAvailable;
            case 3:
                return isEmailVerified;
            case 4:
                return acceptTerms;
            default:
                return false;
        }
    })();

    useEffect(() => {
        if (verifyTimer <= 0) {
            if (!isEmailVerified && isVerificationSent && verifyCodeState !== 'INTERNET_ERROR') {
                setVerifyCodeState('RESEND');
            }
            return;
        }

        const timerId = window.setInterval(() => {
            setVerifyTimer((current) => (current > 1 ? current - 1 : 0));
        }, 1000);

        return () => window.clearInterval(timerId);
    }, [verifyTimer, isEmailVerified, isVerificationSent, verifyCodeState]);

    useEffect(() => {
        if (resendTimer <= 0) return;

        const timerId = window.setInterval(() => {
            setResendTimer((current) => (current > 1 ? current - 1 : 0));
        }, 1000);

        return () => window.clearInterval(timerId);
    }, [resendTimer]);

    useEffect(() => {
        setVerifyCode('');
        setSignupToken('');
        setVerifyCodeState('DEFAULT');
        setVerifyTimer(0);
        setResendTimer(0);
        setEmailSendError(null);
        setEmailSendRejected(false);
        setGlobalError(null);
    }, [email]);

    const handleSendVerification = async () => {
        if (!canSendVerification) return;

        setGlobalError(null);
        setEmailSendError(null);
        setEmailSendRejected(false);
        setEmailSending(true);
        setVerifyCode('');
        setSignupToken('');
        setVerifyCodeState('LOADING');

        const requestedEmail = email;
        try {
            await sendEmailVerification(requestedEmail);
            if (emailRef.current !== requestedEmail) return;

            setVerifyTimer(VERIFY_EXPIRE_SECONDS);
            setResendTimer(VERIFY_RESEND_SECONDS);
            setVerifyCodeState('DEFAULT');
            setStep(3);
        } catch (err: any) {
            if (emailRef.current !== requestedEmail) return;

            const status = err?.response?.status;
            if (status === 409) {
                setEmailSendError('이미 사용중인 이메일입니다');
                setEmailSendRejected(true);
                setVerifyCodeState('ERROR');
            } else if (status === 400) {
                setEmailSendError('유효한 이메일을 입력하세요');
                setEmailSendRejected(true);
                setVerifyCodeState('ERROR');
            } else if (status === 429) {
                setEmailSendError('인증번호 전송 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
                setVerifyCodeState('INTERNET_ERROR');
            } else {
                setEmailSendError('인증번호를 전송하지 못했습니다. 잠시 후 다시 시도해주세요.');
                setVerifyCodeState('INTERNET_ERROR');
            }
        } finally {
            setEmailSending(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!canVerifyCode) return;

        setGlobalError(null);
        setEmailVerifying(true);
        setVerifyCodeState('LOADING');

        try {
            const response = await verifyEmailCode(email, verifyCode);
            setSignupToken(response.token);
            setVerifyCodeState('SUCCESS');
            setVerifyTimer(0);
            setResendTimer(0);
            setStep(4);
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 400 || status === 409) {
                setVerifyCode('');
                setVerifyCodeState('ERROR');
            } else {
                setVerifyCodeState('INTERNET_ERROR');
            }
        } finally {
            setEmailVerifying(false);
        }
    };

    const handleNext = async () => {
        if (!canProceed || loading || resultState === 'LOADING') return;
        if (step < STEP_META.length - 1) {
            setStep((s) => s + 1);
            return;
        }
        setGlobalError(null);
        setResultState('LOADING');
        const resp = await submit({
            username,
            email,
            password,
            token: signupToken,
            displayName: username,
            acceptTerms,
        });
        if (!resp) {
            setResultState('ERROR');
            return;
        }
        setSuccessNextUrl(resp.next ?? null);
        setResultState('SUCCESS');
    };

    const handleResultAction = () => {
        if (resultState === 'SUCCESS') {
            if (successNextUrl) {
                window.location.href = successNextUrl;
            } else {
                navigate('/login');
            }
            return;
        }

        setResultState('FORM');
    };

    const meta = STEP_META[step];
    const isLast = step === STEP_META.length - 1;

    const resultAnimationData =
        resultState === 'LOADING'
            ? signupLoadingAnimation
            : resultState === 'SUCCESS'
            ? signupSuccessAnimation
            : signupErrorAnimation;
    const resultAnimationLoop = resultState === 'LOADING';

    if (resultState !== 'FORM') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_18%_14%,var(--ss-brand-soft)_0,transparent_30%),radial-gradient(circle_at_86%_86%,var(--ss-info-soft)_0,transparent_34%),var(--ss-canvas)] px-4 py-10">
                <div className="w-full max-w-[460px] rounded-[24px] border border-line bg-panel px-6 py-8 shadow-[var(--ss-shadow-md)] sm:px-9 sm:py-10">
                    <div className="flex gap-1.5">
                        {STEP_META.map((_, i) => (
                            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-line'}`} />
                        ))}
                    </div>

                    <p className="mt-5 text-xs font-semibold text-muted tracking-wide">STEP {STEP_META.length} / {STEP_META.length} · 완료</p>

                    <h1 className="mt-3 text-2xl leading-tight font-bold text-ink whitespace-pre-line">
                        {resultState === 'LOADING'
                            ? '회원가입을 진행하고\n있어요.'
                            : resultState === 'SUCCESS'
                            ? 'StarSnap에 오신것을\n환영합니다.'
                            : '회원가입 처리 중\n문제가 발생했습니다.'}
                    </h1>

                    <div className="mt-8 h-[220px] rounded-2xl border border-line bg-surface flex items-center justify-center">
                        <Lottie
                            animationData={resultAnimationData}
                            loop={resultAnimationLoop}
                            autoplay
                            className="w-[240px] h-[170px]"
                        />
                    </div>

                    {resultState !== 'LOADING' && (
                        <button
                            onClick={handleResultAction}
                            className="mt-6 w-full h-12 rounded-lg font-bold text-on-brand transition bg-brand hover:brightness-95"
                        >
                            {resultState === 'SUCCESS' ? '로그인으로 이동' : '다시 시도'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const nextButtonDisabled = !canProceed || loading;
    const primaryButtonLabel = (() => {
        if (step === 2) {
            if (emailSending) return '전송 중...';
            return '인증번호 전송';
        }
        if (step === 3) {
            if (emailVerifying) return '인증 중...';
            return '인증하기';
        }
        if (loading) return '처리 중...';
        return isLast ? '가입하기' : '다음';
    })();

    const primaryButtonDisabled = (() => {
        if (step === 2) return !canSendVerification;
        if (step === 3) return !canVerifyCode;
        return nextButtonDisabled;
    })();

    const handlePrimaryAction = () => {
        if (step === 2) {
            void handleSendVerification();
            return;
        }
        if (step === 3) {
            void handleVerifyCode();
            return;
        }
        void handleNext();
    };

    const verificationHelper = (() => {
        switch (verifyCodeState) {
            case 'ERROR':
                return { text: '인증번호가 일치하지 않습니다.', className: 'text-danger' };
            case 'SUCCESS':
            return { text: '이메일 인증이 완료되었습니다.', className: 'text-success' };
            case 'LOADING':
                return { text: emailSending ? '인증번호를 전송하고 있습니다...' : '인증번호를 확인하고 있습니다...', className: 'text-muted' };
            case 'RESEND':
                return { text: '인증번호를 다시 전송해 주세요.', className: 'text-muted' };
            case 'INTERNET_ERROR':
                return { text: '네트워크 오류가 발생했습니다. 다시 시도해주세요.', className: 'text-danger' };
            default:
                return { text: isVerificationSent ? '이메일 확인 후 인증번호 4자리를 입력해주세요.' : '이메일 인증을 위해 인증번호 전송이 필요합니다.', className: 'text-muted' };
        }
    })();

    const formattedVerifyTimer = `${String(Math.floor(verifyTimer / 60)).padStart(2, '0')}:${String(verifyTimer % 60).padStart(2, '0')}`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_18%_14%,var(--ss-brand-soft)_0,transparent_30%),radial-gradient(circle_at_86%_86%,var(--ss-info-soft)_0,transparent_34%),var(--ss-canvas)] px-4 py-10">
            <div className="w-full max-w-[460px] rounded-[24px] border border-line bg-panel px-6 py-8 shadow-[var(--ss-shadow-md)] sm:px-9 sm:py-10">
                    {/* progress */}
                    <div className="flex gap-1.5">
                        {STEP_META.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                    i <= step ? 'bg-brand' : 'bg-line'
                                }`}
                            />
                        ))}
                    </div>

                    <p className="mt-5 text-xs font-semibold text-muted tracking-wide">
                        STEP {step + 1} / {STEP_META.length} · {meta.label}
                    </p>
                    <h1 className="mt-2 text-2xl leading-tight font-bold text-ink">
                        {meta.title[0]}
                        <br />
                        {meta.title[1]}
                    </h1>
                    <p className="mt-2 text-sm text-sub">{meta.hint}</p>

                    <div className="mt-7">
                        {step === 0 && (
                            <>
                                <Field
                                    value={username}
                                    onChange={setUsername}
                                    placeholder="아이디"
                                    valid={usernameValid && usernameCheck.available === true}
                                    okText={usernameCheck.available === true ? '사용 가능한 아이디입니다' : undefined}
                                    infoText={usernameValid && usernameCheck.loading ? '아이디 중복 확인 중...' : undefined}
                                    errorText={
                                        username.length > 0 && !usernameValid
                                            ? '아이디는 4~12자의 영문/숫자만 가능합니다'
                                            : usernameCheck.available === false
                                            ? '이미 사용중인 아이디입니다'
                                            : usernameCheck.error ?? undefined
                                    }
                                    onEnter={handleNext}
                                />
                            </>
                        )}

                        {step === 1 && (
                            <div className="flex flex-col gap-0">
                                <Field
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={setPassword}
                                    placeholder="비밀번호"
                                    valid={password.length > 0 && PASSWORD_REGEX.test(password)}
                                    reserveHelperSpace={false}
                                />
                                <Field
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordConfirm}
                                    onChange={setPasswordConfirm}
                                    placeholder="비밀번호 확인"
                                    valid={passwordState === 'SUCCESS'}
                                    okText={passwordState === 'SUCCESS' ? '비밀번호가 일치합니다.' : undefined}
                                    errorText={
                                        passwordState === 'ERROR'
                                            ? '영문 대소문자, 숫자, 특수문자를 포함하여 8~50자로 입력해주세요.'
                                            : passwordState === 'CONFIRM_EMPTY'
                                            ? '비밀번호 확인을 입력해주세요.'
                                            : passwordState === 'INVALID_CONFIRM'
                                            ? '비밀번호가 일치하지 않습니다.'
                                            : undefined
                                    }
                                    infoText={
                                        passwordState === 'DEFAULT'
                                            ? '영문 대소문자, 숫자, 특수문자를 포함하여 8~50자로 입력해주세요.'
                                            : undefined
                                    }
                                    onEnter={handleNext}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-4">
                                <Field
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={setEmail}
                                    placeholder="you@example.com"
                                    disabled={emailSending}
                                    valid={emailAvailable}
                                    okText={emailAvailable ? '사용 가능한 이메일입니다' : undefined}
                                    infoText={emailValid && emailCheck.loading ? '이메일 확인 중...' : undefined}
                                    errorText={
                                        email.length > 0 && !emailValid
                                            ? '유효한 이메일을 입력하세요'
                                            : emailCheck.available === false
                                            ? '이미 사용중인 이메일입니다'
                                            : emailSendError ?? emailCheck.error ?? undefined
                                    }
                                    onEnter={handleSendVerification}
                                />

                            </div>
                        )}

                        {step === 3 && (
                            <div className="rounded-2xl border border-line bg-surface p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className={`text-sm ${verificationHelper.className}`}>{verificationHelper.text}</p>
                                    {verifyTimer > 0 && !isEmailVerified && (
                                        <span className="shrink-0 text-sm font-semibold text-muted">{formattedVerifyTimer}</span>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-center gap-3">
                                    {Array.from({ length: VERIFY_CODE_LENGTH }, (_, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={1}
                                            value={verifyCode[index] ?? ''}
                                            onChange={(e) => {
                                                const nextChar = e.target.value.replace(/\D/g, '').slice(-1);
                                                const chars = verifyCode.padEnd(VERIFY_CODE_LENGTH).split('');
                                                chars[index] = nextChar;
                                                setVerifyCode(chars.join('').trim());
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !verifyCode[index] && index > 0) {
                                                    const prev = document.getElementById(`signup-verify-${index - 1}`) as HTMLInputElement | null;
                                                    prev?.focus();
                                                }
                                            }}
                                            onInput={(e) => {
                                                const target = e.currentTarget as HTMLInputElement;
                                                if (target.value && index < VERIFY_CODE_LENGTH - 1) {
                                                    const next = document.getElementById(`signup-verify-${index + 1}`) as HTMLInputElement | null;
                                                    next?.focus();
                                                }
                                            }}
                                            id={`signup-verify-${index}`}
                                            disabled={isEmailVerified || verifyTimer === 0 || emailVerifying}
                                            className="h-[72px] w-[60px] rounded-xl border border-line bg-panel text-center text-3xl text-ink focus:outline-none focus:ring-1 focus:ring-brand disabled:bg-surface"
                                        />
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSendVerification}
                                    disabled={!canSendVerification}
                                    className="mt-4 w-full text-sm font-semibold text-sub transition disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {resendTimer > 0 ? `${resendTimer}초 후 재전송 가능` : '인증번호 재전송'}
                                </button>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="flex flex-col gap-3">
                                <CheckRow
                                    checked={acceptTerms}
                                    onChange={setAcceptTerms}
                                    label={
                                        <>
                                            <span className="text-danger">[필수]</span> 서비스 이용약관 및 개인정보 처리방침 동의
                                        </>
                                    }
                                />
                                <CheckRow
                                    checked={acceptMarketing}
                                    onChange={setAcceptMarketing}
                                    label={<>[선택] 마케팅 정보 수신 동의</>}
                                />
                            </div>
                        )}
                    </div>

                    {globalError && <p className="mt-3 text-sm text-danger">{globalError}</p>}

                    <button
                        type="button"
                        onClick={primaryButtonDisabled ? undefined : handlePrimaryAction}
                        disabled={primaryButtonDisabled}
                        aria-disabled={primaryButtonDisabled}
                        className={`mt-6 h-12 w-full rounded-xl font-bold shadow-sm ${
                            primaryButtonDisabled ? 'bg-brand-soft text-ink' : 'bg-brand text-on-brand hover:brightness-95'
                        }`}
                        style={{
                            opacity: loading || emailSending || emailVerifying ? 0.8 : 1,
                        }}
                    >
                        {primaryButtonLabel}
                    </button>

                    <div className="mt-5 flex items-center justify-center gap-2 text-sm">
                        {step > 0 ? (
                            <button type="button" onClick={() => setStep((s) => s - 1)} className="text-sub hover:text-ink">
                                이전 단계로
                            </button>
                        ) : (
                            <>
                                <span className="text-sub">이미 계정이 있으신가요?</span>
                                <button type="button" onClick={() => navigate('/login')} className="min-h-11 rounded-lg px-2 font-bold text-ink underline decoration-brand decoration-2 underline-offset-4">
                                    로그인
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
    );
};

type FieldProps = {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    autoComplete?: string;
    disabled?: boolean;
    valid?: boolean;
    okText?: string;
    errorText?: string;
    infoText?: string;
    reserveHelperSpace?: boolean;
    onEnter?: () => void;
};

const Field: React.FC<FieldProps> = ({
    value,
    onChange,
    placeholder,
    type = 'text',
    autoComplete,
    disabled = false,
    valid,
    okText,
    errorText,
    infoText,
    reserveHelperSpace = true,
    onEnter,
}) => {
    const helperId = useId();
    const helperText = errorText || (valid && okText ? okText : infoText) || (reserveHelperSpace ? '\u00A0' : '');
    const helperClass = errorText
        ? 'text-danger'
        : valid && okText
                                                ? 'text-success'
        : infoText
        ? 'text-muted'
        : 'text-transparent';

    return (
        <div>
            <div className="relative">
                <input
                    type={type}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    aria-label={placeholder}
                    aria-describedby={helperId}
                    aria-invalid={Boolean(errorText)}
                    className={inputClass}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
                />
                {valid && (
                                            <CheckIcon size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success" />
                )}
            </div>
            <p
                id={helperId}
                aria-live="polite"
                role={errorText ? 'alert' : undefined}
                className={`mt-2 text-sm ${reserveHelperSpace ? 'min-h-[20px]' : ''} ${helperClass}`}
            >
                {helperText}
            </p>
        </div>
    );
};

type CheckRowProps = { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode };

const CheckRow: React.FC<CheckRowProps> = ({ checked, onChange, label }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-full flex items-center gap-3 h-12 px-4 rounded-lg border border-line-strong bg-surface text-left"
    >
        <span
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                checked ? 'bg-brand' : 'bg-panel border border-line-strong'
            }`}
        >
            {checked && <CheckIcon size={14} className="text-on-brand" />}
        </span>
        <span className="text-sm text-ink">{label}</span>
    </button>
);

export default SignupPage;
