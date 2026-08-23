import axios, { AxiosHeaders } from 'axios';

function resolveApiHost() {
    const raw = import.meta.env.VITE_PUBLIC_LOCAL_API_HOST || '';
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

const CustomAxios = axios.create({
    withCredentials: true,
    baseURL: `${API_HOST}/api/`,
    timeout: 90000,
});

CustomAxios.interceptors.request.use(
    function (config) {
        config.withCredentials = true;
        config.headers = AxiosHeaders.from(config.headers);
        config.headers.delete('Authorization');
        return Promise.resolve(config);
    },
    error => Promise.reject(error),
);

CustomAxios.interceptors.response.use(
    response => {
        return response;
    }
)

export default CustomAxios;
