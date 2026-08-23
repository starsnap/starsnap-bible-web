import {GoogleOneTapLogin} from "../../components/auth/GoogleOneTapLogin";
import OauthSignupModal from "../../components/auth/OauthSignupModal";
import {SignUpModalProvider, useSignUpModalContext} from "../../context/SignUpModalContext";

const MainPageInner = () => {
    const {showModal} = useSignUpModalContext();
    return (
        <>
            <div>
                {showModal && <OauthSignupModal/>}
                <GoogleOneTapLogin/>
            </div>
        </>
    )
}

const MainPage = () => {
    return (
        <SignUpModalProvider>
            <MainPageInner/>
        </SignUpModalProvider>
    )
}

export default MainPage