import React, { useState } from 'react';
import { 
    Paper, TextField, Button, Typography, Box, 
    Alert, CircularProgress, InputAdornment, Stack 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import LockResetIcon from '@mui/icons-material/LockReset';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LogoutIcon from '@mui/icons-material/Logout';

export default function CambioPasswordObligatorio() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [exito, setExito] = useState(false);
    const navigate = useNavigate();

    const userName = localStorage.getItem('user_name') || 'Usuario';
    const userRol = localStorage.getItem('user_rol');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden. Por favor verifícalas.');
            return;
        }

        setLoading(true);
        try {
            await api.post('cambiar-password-primer-ingreso/', { password });
            localStorage.setItem('debe_cambiar_password', 'false');
            setExito(true);

            setTimeout(() => {
                if (userRol === 'Cliente') {
                    navigate('/mis-solicitudes');
                } else if (userRol === 'Tecnico') {
                    navigate('/calendario');
                } else {
                    navigate('/dashboard');
                }
            }, 1500);

        } catch (err) {
            console.error('Error al actualizar contraseña', err);
            const msg = err.response?.data?.detail || 'Ocurrió un error al actualizar la contraseña.';
            setError(msg);
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
                bgcolor: '#f0f2f5',
                p: 2
            }}
        >
            <Paper 
                elevation={4} 
                sx={{ 
                    p: { xs: 3, sm: 5 }, 
                    width: '100%', 
                    maxWidth: 460, 
                    borderRadius: 3, 
                    textAlign: 'center',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <Box 
                    sx={{ 
                        width: 64, 
                        height: 64, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.light', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'primary.contrastText',
                        mb: 2
                    }}
                >
                    <LockResetIcon sx={{ fontSize: 36 }} />
                </Box>

                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Cambio Obligatorio de Contraseña
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ¡Hola <strong>{userName}</strong>! Por motivos de seguridad institucional, debes cambiar tu contraseña temporal antes de comenzar a usar la plataforma.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2, textAlign: 'left' }}>
                        {error}
                    </Alert>
                )}

                {exito ? (
                    <Alert icon={<CheckCircleOutlineIcon fontSize="inherit" />} severity="success" sx={{ width: '100%', mb: 2 }}>
                        ¡Contraseña establecida con éxito! Redirigiendo a tu espacio de trabajo...
                    </Alert>
                ) : (
                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Nueva Contraseña"
                            type="password"
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            helperText="Mínimo 6 caracteres"
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Confirmar Nueva Contraseña"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ 
                                py: 1.4, 
                                fontWeight: 'bold', 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                mb: 2
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Establecer Contraseña y Continuar'}
                        </Button>

                        <Stack direction="row" justifyContent="center">
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<LogoutIcon />}
                                onClick={handleLogout}
                                sx={{ textTransform: 'none', color: 'text.secondary' }}
                            >
                                Salir y cerrar sesión
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
