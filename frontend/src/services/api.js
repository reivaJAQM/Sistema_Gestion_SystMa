import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/';

// Instancia principal de Axios
const api = axios.create({
    baseURL: BASE_URL,
});

// ── Interceptor de REQUEST: inyectar access token ──────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Interceptor de RESPONSE: refrescar token en 401 ───────────────────────
let isRefreshing = false;
let failedQueue = [];   // peticiones en espera mientras se refresca el token

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,         // 2xx → dejar pasar sin cambios
    async (error) => {
        const originalRequest = error.config;

        // Solo actuar en 401 y si no es una petición ya reintentada
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Si ya hay un refresh en curso, encolar esta petición
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            // Sin refresh token → ir al login directamente
            if (!refreshToken) {
                isRefreshing = false;
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Intentar renovar el access token
                const { data } = await axios.post(`${BASE_URL}token/refresh/`, {
                    refresh: refreshToken,
                });

                const newAccessToken = data.access;
                localStorage.setItem('access_token', newAccessToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);
                return api(originalRequest);   // reintentar petición original
            } catch (refreshError) {
                // Si el refresh también falla → sesión expirada, logout
                processQueue(refreshError, null);
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;