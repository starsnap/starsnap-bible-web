import customAxios from "../../lib/axios/CustomAxios";
import {useSignUpModalContext} from "../../context/SignUpModalContext"
import {CustomColor, CustomFontSize} from "../../constant/color/custom-color.constant";
import { useState, useEffect, useRef } from "react";
import Lottie from 'lottie-react';
import signupLoadingAnimation from '../../assets/lottie/signup_loading.json';
import signupSuccessAnimation from '../../assets/lottie/signup_success.json';
import signupErrorAnimation from '../../assets/lottie/signup_error.json';

type SignupResultState = 'FORM' | 'LOADING' | 'SUCCESS' | 'ERROR';

const OauthSignupModal = () => {

    const { setShowModal, username, setUsername, googleToken } = useSignUpModalContext()
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [isDuplicateUsername, setIsDuplicateUsername] = useState(false);
    const [resultState, setResultState] = useState<SignupResultState>('FORM');
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Username 중복 확인
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (!username.trim()) {
            setError("");
            setIsDuplicateUsername(false);
            return;
        }

        setIsChecking(true);

        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await customAxios.get(`/auth/valid/username?username=${encodeURIComponent(username.trim())}`);

                const isAvailable =
                    response.status === 200 ||
                    response.data?.status === 200 ||
                    response.data?.available === true ||
                    response.data?.message === "사용가능한 닉네임입니다.";

                if (isAvailable) {
                    setError("");
                    setIsDuplicateUsername(false);
                } else {
                    setError("이미 사용중인 닉네임입니다.");
                    setIsDuplicateUsername(true);
                }
            } catch (err: any) {
                console.error("username 확인 실패:", err);
                if (err.response?.status === 409) {
                    setError("이미 사용중인 닉네임입니다.");
                    setIsDuplicateUsername(true);
                } else {
                    setError("닉네임 확인 중 오류가 발생했습니다.");
                    setIsDuplicateUsername(true);
                }
            } finally {
                setIsChecking(false);
            }
        }, 500);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [username]);

    const handleSignup = async () => {
        if (!username.trim()) {
            setError("닉네임을 입력해주세요.");
            return;
        }

        if (isDuplicateUsername) {
            setError("이미 사용중인 닉네임입니다.");
            return;
        }

        if (!googleToken) {
            setError("토큰 정보가 없습니다.");
            return;
        }

        setLoading(true);
        setError("");
        setResultState('LOADING');

        try {
            const response = await customAxios.post('/oauth/signup', {
                type: 'GOOGLE',
                token: googleToken,
                username: username.trim()
            });

            if (response.status === 200 || response.status === 201) {
                setResultState('SUCCESS');
            }
        } catch (err: any) {
            console.error("회원가입 실패:", err);
            setError(err.response?.data?.message || "회원가입에 실패했습니다.");
            setResultState('ERROR');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setUsername("");
        setError("");
        setResultState('FORM');
    };

    const retrySignup = () => {
        setError("");
        setResultState('FORM');
    };

    const resultAnimationData =
        resultState === 'LOADING'
            ? signupLoadingAnimation
            : resultState === 'SUCCESS'
            ? signupSuccessAnimation
            : signupErrorAnimation;
    const resultAnimationLoop = resultState === 'LOADING';


    return (
        <>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: CustomColor.overlay_50,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: CustomColor.white,
                    padding: '30px',
                    borderRadius: '10px',
                    maxWidth: '400px',
                    width: '90%'
                }}>
                    {resultState === 'FORM' ? (
                        <>
                            <h2 style={{ color: CustomColor.title }}>회원가입</h2>
                            <p style={{ color: CustomColor.sub_title, marginBottom: '20px' }}>닉네임을 입력해주세요</p>

                            <input
                                type="text"
                                placeholder="닉네임 입력"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '10px',
                                    border: isDuplicateUsername ? `2px solid ${CustomColor.error}` : `1px solid ${CustomColor.button}`,
                                    borderRadius: '5px',
                                    fontSize: CustomFontSize.label,
                                    boxSizing: 'border-box',
                                    backgroundColor: isChecking ? CustomColor.container : CustomColor.white,
                                    color: CustomColor.light_black,
                                }}
                                disabled={loading}
                            />
                            {isChecking && <div style={{
                                fontSize: CustomFontSize.caption,
                                color: CustomColor.gray,
                                marginBottom: '10px'
                            }}>닉네임 확인 중...</div>}

                            {error && (
                                <div style={{
                                    color: CustomColor.error,
                                    marginBottom: '10px',
                                    fontSize: CustomFontSize.label
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                marginTop: '20px'
                            }}>
                                <button
                                    onClick={closeModal}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border: `1px solid ${CustomColor.button}`,
                                        borderRadius: '5px',
                                        backgroundColor: CustomColor.container,
                                        cursor: 'pointer',
                                        fontSize: CustomFontSize.label,
                                        color: CustomColor.sub_title,
                                    }}
                                    disabled={loading}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSignup}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border: 'none',
                                        borderRadius: '5px',
                                        backgroundColor: (loading || isChecking || isDuplicateUsername) ? CustomColor.button : CustomColor.yellow_500,
                                        color: (loading || isChecking || isDuplicateUsername) ? CustomColor.gray : CustomColor.light_black,
                                        cursor: (loading || isChecking || isDuplicateUsername) ? 'not-allowed' : 'pointer',
                                        fontSize: CustomFontSize.label
                                    }}
                                    disabled={loading || isChecking || isDuplicateUsername}
                                >
                                    {loading ? '가입 중...' : '회원가입'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 style={{ color: CustomColor.title, marginBottom: '8px' }}>
                                {resultState === 'LOADING'
                                    ? '회원가입 진행 중'
                                    : resultState === 'SUCCESS'
                                    ? '회원가입 완료'
                                    : '회원가입 실패'}
                            </h2>
                            <p style={{ color: CustomColor.sub_title, marginBottom: '20px' }}>
                                {resultState === 'LOADING'
                                    ? '잠시만 기다려주세요.'
                                    : resultState === 'SUCCESS'
                                    ? 'StarSnap에 오신 것을 환영합니다.'
                                    : (error || '다시 시도해주세요.')}
                            </p>

                            <div style={{
                                width: '100%',
                                height: '170px',
                                borderRadius: '10px',
                                backgroundColor: CustomColor.container,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px'
                            }}>
                                <Lottie
                                    animationData={resultAnimationData}
                                    loop={resultAnimationLoop}
                                    autoplay
                                    style={{ width: 220, height: 140 }}
                                />
                            </div>

                            {resultState !== 'LOADING' && (
                                <button
                                    onClick={resultState === 'SUCCESS' ? closeModal : retrySignup}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: 'none',
                                        borderRadius: '5px',
                                        backgroundColor: CustomColor.yellow_500,
                                        color: CustomColor.light_black,
                                        cursor: 'pointer',
                                        fontSize: CustomFontSize.label,
                                        fontWeight: 700,
                                    }}
                                >
                                    {resultState === 'SUCCESS' ? '확인' : '다시 시도'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    )
}



export default OauthSignupModal
