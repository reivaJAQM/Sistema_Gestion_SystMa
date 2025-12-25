import axios from 'axios';

// Configuración base de Axios
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

// Interceptor: Antes de cada petición, inyectamos el Token si existe
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

export default api;