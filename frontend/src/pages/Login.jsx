import React, { useState } from 'react';
import { 
    Container, Paper, TextField, Button, Typography, Box, 
    Alert, CircularProgress, InputAdornment 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';

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
            const response = await api.post('token/', { username, password });
            
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user_rol', response.data.rol);
            localStorage.setItem('user_id', response.data.user_id);
            localStorage.setItem('user_name', response.data.nombre_completo);

            const rol = response.data.rol;
            if (rol === 'Administrador') navigate('/calendario');
            else if (rol === 'Tecnico') navigate('/calendario');
            else if (rol === 'Supervisor') navigate('/panel-supervisor');
            else if (rol === 'Cliente') navigate('/mis-ordenes');
            else navigate('/calendario');

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
                bgcolor: '#f8f9fa', // Un gris "casi blanco" muy elegante
                p: 2
            }}
        >
            <Paper 
                elevation={4} // Sombra suave, no agresiva
                sx={{ 
                    p: 5, 
                    width: '100%', 
                    maxWidth: 400, 
                    borderRadius: 3, 
                    textAlign: 'center',
                    bgcolor: '#ffffff', // Blanco puro
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
                        label="Usuario"
                        variant="outlined"
                        fullWidth
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonOutlineIcon color="action" />
                                </InputAdornment>
                            ),
                            style: { borderRadius: 12 } // Bordes redondeados en los inputs
                        }}
                    />

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
                                    <LockOutlinedIcon color="action" />
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
                        disableElevation // Sin sombra en el botón para look "Flat" moderno
                        startIcon={!loading && <LoginIcon />}
                        sx={{ 
                            mt: 2, 
                            py: 1.5, 
                            borderRadius: 3, 
                            fontSize: '1rem', 
                            fontWeight: 'bold',
                            textTransform: 'none',
                            bgcolor: '#1976d2', // Azul SystMa
                            '&:hover': { bgcolor: '#115293' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}