import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button,
    Alert, CircularProgress, InputAdornment, LinearProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';

// Calcula fortaleza de contraseña (0-4)
function calcularFortaleza(pwd) {
    let score = 0;
    if (pwd.length >= 6)  score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
}

const FORTALEZA_LABEL = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
const FORTALEZA_COLOR = ['', 'error', 'warning', 'info', 'success'];

export default function ResetearContrasena() {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword]   = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [loading, setLoading]     = useState(false);
    const [exito, setExito]         = useState(false);
    const [error, setError]         = useState('');

    const fortaleza = calcularFortaleza(password);
    const coincide  = password === confirmar && confirmar.length > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmar) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await api.post('password-reset/confirm/', { uid, token, password });
            setExito(true);
        } catch (err) {
            const msg = err.response?.data?.detail;
            setError(msg || 'El enlace expiró o ya fue utilizado. Solicita uno nuevo.');
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
                {!exito ? (
                    <>
                        <Box
                            sx={{
                                width: 72, height: 72,
                                bgcolor: '#e3f2fd', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                            }}
                        >
                            <LockIcon sx={{ fontSize: 38, color: '#1976d2' }} />
                        </Box>

                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                            Nueva Contraseña
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Elige una contraseña segura para tu cuenta.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {/* Nueva contraseña */}
                            <Box>
                                <TextField
                                    fullWidth
                                    label="Nueva Contraseña"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><LockIcon color="action" fontSize="small" /></InputAdornment>,
                                        style: { borderRadius: 12 }
                                    }}
                                />
                                {/* Barra de fortaleza */}
                                {password.length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(fortaleza / 4) * 100}
                                            color={FORTALEZA_COLOR[fortaleza]}
                                            sx={{ height: 6, borderRadius: 3 }}
                                        />
                                        <Typography variant="caption" color={`${FORTALEZA_COLOR[fortaleza]}.main`} sx={{ mt: 0.3, display: 'block' }}>
                                            Fortaleza: {FORTALEZA_LABEL[fortaleza]}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Confirmar contraseña */}
                            <TextField
                                fullWidth
                                label="Confirmar Contraseña"
                                type="password"
                                value={confirmar}
                                onChange={e => setConfirmar(e.target.value)}
                                required
                                error={confirmar.length > 0 && !coincide}
                                helperText={confirmar.length > 0 && !coincide ? 'Las contraseñas no coinciden' : ''}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><LockIcon color="action" fontSize="small" /></InputAdornment>,
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
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Cambiar Contraseña'}
                            </Button>
                        </Box>
                    </>
                ) : (
                    /* ── Éxito ── */
                    <Box sx={{ width: '100%' }}>
                        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            ¡Contraseña actualizada!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            disableElevation
                            onClick={() => navigate('/login')}
                            sx={{ py: 1.5, borderRadius: 3, fontWeight: 'bold', textTransform: 'none' }}
                        >
                            Ir al inicio de sesión
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
