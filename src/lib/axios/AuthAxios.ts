import axios, { AxiosHeaders } from 'axios';

function resolveApiHost() {
    const raw = import.meta.env.VITE_BIBLE_API_HOST || '';
    if (!raw) return '';

    try {
        const url = new URL(raw);
        const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        if (isLoopback && typeof window !== 'undefined') {
            url.hostname = window.location.hostname;
            return url.origin;
        }
        return url.origin;
    } catch {
        return raw;
    }
}

const API_HOST = import.meta.env.DEV ? '' : resolveApiHost();

const AuthAxios = axios.create({
    withCredentials: true,
    baseURL: `${API_HOST}/api/`,
    timeout: 30000,
});

AuthAxios.interceptors.request.use(
    function (config) {
        config.withCredentials = true;
        config.headers = AxiosHeaders.from(config.headers);
        config.headers.delete('Authorization');

        config.headers.set('Cache-Control', 'no-store');

        return Promise.resolve(config);
    },
    error => Promise.reject(error),
);

AuthAxios.interceptors.response.use(
    response => {
        return response;
    },

    error => {
        if (error.response?.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.replace('/login');
        }
        return Promise.reject(error);
    }
)

export default AuthAxios;
