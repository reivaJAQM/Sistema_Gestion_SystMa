import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button,
    Alert, CircularProgress, InputAdornment, Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import api from '../services/api';

export default function RecuperarContrasena() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('password-reset/', { email });
            setEnviado(true);
        } catch {
            setError('Ocurrió un error. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f8f9fa',
                p: 2,
            }}
        >
            <Paper
                elevation={4}
                sx={{
                    p: 5,
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 3,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Icono */}
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        bgcolor: '#e3f2fd',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                    }}
                >
                    <LockResetIcon sx={{ fontSize: 38, color: '#1976d2' }} />
                </Box>

                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    Recuperar Contraseña
                </Typography>

                {!enviado ? (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                fullWidth
                                label="Correo Electrónico"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    style: { borderRadius: 12 }
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                disableElevation
                                sx={{ py: 1.5, borderRadius: 3, fontWeight: 'bold', fontSize: '1rem', textTransform: 'none' }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar enlace'}
                            </Button>
                        </Box>
                    </>
                ) : (
                    /* ── Estado de éxito ── */
                    <Box sx={{ width: '100%' }}>
                        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography variant="body2" fontWeight="bold">¡Correo enviado!</Typography>
                            <Typography variant="body2">
                                Si el correo <strong>{email}</strong> está registrado, recibirás el enlace de recuperación en breve. Revisa también tu carpeta de spam.
                            </Typography>
                        </Alert>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate('/login')}
                            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold' }}
                        >
                            Volver al inicio de sesión
                        </Button>
                    </Box>
                )}

                {!enviado && (
                    <Link
                        component="button"
                        variant="body2"
                        onClick={() => navigate('/login')}
                        sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                    >
                        <ArrowBackIcon fontSize="small" /> Volver al inicio de sesión
                    </Link>
                )}
            </Paper>
        </Box>
    );
}
