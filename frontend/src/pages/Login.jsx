import React, { useState } from 'react';
import { 
    Paper, TextField, Button, Typography, Box, 
    Alert, CircularProgress, InputAdornment, Link 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconUser, IconLock, IconLogin } from '@tabler/icons-react';
import api from '../services/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('token/', { username: username.trim(), password });
            
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user_rol', response.data.rol);
            if (response.data.user_id || response.data.id) {
                localStorage.setItem('user_id', response.data.user_id || response.data.id);
            }
            localStorage.setItem('user_name', response.data.nombre_completo);
            localStorage.setItem('debe_cambiar_password', response.data.debe_cambiar_password ? 'true' : 'false');

            try {
                const perfilRes = await api.get('perfil/');
                if (perfilRes.data.id || perfilRes.data.user_id) {
                    localStorage.setItem('user_id', perfilRes.data.id || perfilRes.data.user_id);
                }
                if (perfilRes.data.foto_perfil) {
                    localStorage.setItem('user_foto', perfilRes.data.foto_perfil);
                } else {
                    localStorage.removeItem('user_foto');
                }
            } catch {
                localStorage.removeItem('user_foto');
            }

            if (response.data.debe_cambiar_password) {
                navigate('/cambiar-password-obligatorio');
                return;
            }

            const rol = response.data.rol;

            if (rol === 'Tecnico') {
                navigate('/calendario'); // Técnicos van directo a su agenda
            } else if (rol === 'Cliente') {
                navigate('/mis-solicitudes'); // Clientes van directo a su portal
            } else {
                navigate('/dashboard'); // Admin y Supervisor van al panel general
            }

        } catch (error) {
            console.error('Error login', error);
            setError('Credenciales incorrectas. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box 
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f8f9fa',
                p: 2
            }}
        >
            <Paper 
                elevation={4} 
                sx={{ 
                    p: 5, 
                    width: '100%', 
                    maxWidth: 400, 
                    borderRadius: 3, 
                    textAlign: 'center',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                {/* --- LOGO --- */}
                <Box sx={{ mb: 3 }}>
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        style={{ 
                            width: '90px', 
                            height: '90px', 
                            objectFit: 'contain',
                            borderRadius: '50%',
                        }} 
                    />
                </Box>

                <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
                    Iniciar Sesión
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Ingresa tus credenciales para continuar
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    
                    {error && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                    )}

                    <TextField
                        label="Cédula o Usuario"
                        placeholder="Ej: 0912345678"
                        variant="outlined"
                        fullWidth
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconUser size={20} color="#64748b" />
                                </InputAdornment>
                            ),
                            style: { borderRadius: 12 }
                        }}
                    />

                    <Box>
                        <TextField
                            label="Contraseña"
                            type="password"
                            variant="outlined"
                            fullWidth
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconLock size={20} color="#64748b" />
                                    </InputAdornment>
                                ),
                                style: { borderRadius: 12 }
                            }}
                        />
                        {/* Enlace de Olvidaste tu contraseña */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Link 
                                component="button" 
                                type="button"
                                variant="caption" 
                                underline="hover"
                                onClick={() => navigate('/recuperar')}
                                sx={{ 
                                    color: 'text.secondary', 
                                    fontWeight: 500,
                                    '&:hover': { color: 'primary.main' }
                                }}
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </Box>
                    </Box>

                    <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth 
                        size="large"
                        disabled={loading}
                        disableElevation 
                        startIcon={!loading && <IconLogin size={20} />}
                        sx={{ 
                            mt: 1, 
                            py: 1.5, 
                            borderRadius: 3, 
                            fontSize: '1rem', 
                            fontWeight: 'bold',
                            textTransform: 'none',
                            bgcolor: '#0288d1',
                            '&:hover': { bgcolor: '#01579b' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}