import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import MainLayout from '../pages/main/MainLayout';
import HomePage from '../pages/main/HomePage';
import StarPage from '../pages/main/StarPage';
import StarSnapPage from '../pages/main/StarSnapPage';
import StarGroupPage from '../pages/main/StarGroupPage';
import StarGroupDetailPage from '../pages/main/StarGroupDetailPage';
import AddSnapPage from '../pages/main/AddSnapPage';
import SearchPage from '../pages/main/SearchPage';
import SnapDetailPage from '../pages/main/SnapDetailPage';
import EditSnapPage from '../pages/main/EditSnapPage';
import ProfileEditPage from '../pages/main/ProfileEditPage';
import UserPage from '../pages/main/UserPage';
import MessagePage from '../pages/main/MessagePage';
import SavedPage from '../pages/main/SavedPage';
import SettingPage from '../pages/main/SettingPage';
import token from '../lib/token/token';

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
    if (!token.isAuthenticated()) {
        token.clear();
        return <Navigate to="/login" replace />;
    }

    return children;
};

const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RequireAuth><MainLayout/></RequireAuth>}>
                    <Route index element={<HomePage/>} />
                    <Route path="search" element={<SearchPage/>} />
                    <Route path="message" element={<MessagePage/>} />
                    <Route path="star" element={<StarPage/>} />
                    <Route path="star/:starId" element={<StarSnapPage/>} />
                    <Route path="stargroup" element={<StarGroupPage/>} />
                    <Route path="stargroup/:starGroupId" element={<StarGroupDetailPage/>} />
                    <Route path="snap/:snapId" element={<SnapDetailPage/>} />
                    <Route path="snap/:snapId/edit" element={<EditSnapPage/>} />
                    <Route path="saved" element={<SavedPage/>} />
                    <Route path="add" element={<AddSnapPage/>} />
                    <Route path="setting" element={<SettingPage/>} />
                    <Route path="user" element={<UserPage/>} />
                    <Route path="user/:username" element={<UserPage/>} />
                    <Route path="profile" element={<UserPage own/>} />
                    <Route path="profile/edit" element={<ProfileEditPage/>} />
                </Route>

                <Route path="/signup" element={<SignupPage/>} />
                <Route path="/login" element={<LoginPage/>} />
                <Route path="/oauth/signup" element={<SignupPage/>} />
            </Routes>
        </BrowserRouter>
    )
}


export default Router;
