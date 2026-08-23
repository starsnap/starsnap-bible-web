import {useGoogleOneTapLogin} from "@react-oauth/google";
import token from "../../lib/token/token";
import CustomAxios from "../../lib/axios/CustomAxios"
import {useSignUpModalContext} from "../../context/SignUpModalContext"


export function GoogleOneTapLogin() {
    const {setShowModal, setGoogleToken, setUsername} = useSignUpModalContext();
    useGoogleOneTapLogin({
        onSuccess: credentialResponse => {

            CustomAxios.post('oauth/login', {
                token: credentialResponse.credential as string,
                type: 'google'
            }).then(res => {
                if (res.status === 200) {
                    token.markAuthenticated();
                }
            }).catch(err => {
                if (err.response?.status === 409) {
                    // 사용자 없음 - 회원가입 모달 띄우기
                    setGoogleToken(credentialResponse.credential as string);
                    setUsername("");
                    setShowModal(true)
                } else if (err.response?.status === 404) {
                    console.log("404")
                    setShowModal(true)
                }
                console.log(err)
            })
        },
        onError: () => {
            console.log('Login Failed');
        },
    })

    return (
        <>
        </>
    )
}
