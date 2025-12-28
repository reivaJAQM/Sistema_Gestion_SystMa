import React, { useState, useEffect } from 'react';
import { 
    Container, TextField, Button, Typography, Paper, 
    MenuItem, Alert, Tabs, Tab, Box, Card, CardContent, 
    Avatar, Chip, CircularProgress, IconButton, Divider, Stack
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import BuildIcon from '@mui/icons-material/Build';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../services/api';

export default function GestionUsuarios() {
    const [tabValue, setTabValue] = useState(0);
    const [personal, setPersonal] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        username: '', first_name: '', last_name: '', 
        email: '', password: '', rol: '' 
    });
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarPersonal();
    }, []);

    const cargarPersonal = async () => {
        setLoading(true);
        try {
            const [resTecnicos, resSupervisores] = await Promise.all([
                api.get('tecnicos/'),
                api.get('supervisores/')
            ]);
            const tecnicos = resTecnicos.data.map(u => ({ ...u, rol_visual: 'Tecnico' }));
            const supervisores = resSupervisores.data.map(u => ({ ...u, rol_visual: 'Supervisor' }));
            setPersonal([...supervisores, ...tecnicos]);
        } catch (error) {
            console.error("Error cargando personal", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setMensaje(null);
        setError(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje(null);
        setError(null);
        try {
            await api.post('crear-usuario/', formData);
            setFormData({ username: '', first_name: '', last_name: '', email: '', password: '', rol: '' });
            await cargarPersonal(); 
            setTabValue(0); 
            alert("Usuario creado exitosamente");
        } catch (err) {
            console.error(err);
            setError("Error al crear usuario. El nombre de usuario podría estar duplicado.");
        }
    };

    const renderUserCard = (user) => (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, '&:hover': { boxShadow: 3, borderColor: user.rol_visual === 'Supervisor' ? '#7b1fa2' : '#ed6c02' } }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: user.rol_visual === 'Supervisor' ? '#7b1fa2' : '#ed6c02' }}>
                        {user.rol_visual === 'Supervisor' ? <SupervisorAccountIcon /> : <BuildIcon />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">{user.first_name} {user.last_name}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>@{user.username}</Typography>
                        <Chip label={user.rol_visual} size="small" color={user.rol_visual === 'Supervisor' ? 'secondary' : 'warning'} variant="outlined" />
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );

    const listaSupervisores = personal.filter(p => p.rol_visual === 'Supervisor');
    const listaTecnicos = personal.filter(p => p.rol_visual === 'Tecnico');

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#1976d2', p: 3, color: 'white' }}>
                    <Typography variant="h5" fontWeight="bold">Gestión de Personal</Typography>
                    <Typography variant="body2">Administra técnicos y supervisores del sistema</Typography>
                </Box>

                <Tabs value={tabValue} onChange={handleTabChange} centered variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab icon={<GroupIcon />} label="Directorio" iconPosition="start" />
                    <Tab icon={<PersonAddIcon />} label="Registrar Nuevo" iconPosition="start" />
                </Tabs>

                <Box sx={{ p: 4 }}>
                    {tabValue === 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Directorio de Personal</Typography>
                                <IconButton onClick={cargarPersonal} color="primary"><RefreshIcon /></IconButton>
                            </Box>
                            {loading ? <Box display="flex" justifyContent="center"><CircularProgress /></Box> : (
                                <>
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle1" sx={{ color: '#7b1fa2', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <SupervisorAccountIcon fontSize="small"/> Supervisores ({listaSupervisores.length})
                                        </Typography>
                                        <Divider sx={{ mb: 2, bgcolor: '#7b1fa2', height: 2, opacity: 0.2 }} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                                            {listaSupervisores.length > 0 ? listaSupervisores.map(renderUserCard) : <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic', color: 'text.secondary' }}>No hay supervisores.</Typography>}
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ color: '#ed6c02', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <BuildIcon fontSize="small"/> Técnicos ({listaTecnicos.length})
                                        </Typography>
                                        <Divider sx={{ mb: 2, bgcolor: '#ed6c02', height: 2, opacity: 0.2 }} />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                                            {listaTecnicos.length > 0 ? listaTecnicos.map(renderUserCard) : <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic', color: 'text.secondary' }}>No hay técnicos.</Typography>}
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}

                    {/* --- FORMULARIO CON LAYOUT MANUAL (FLEXBOX) --- */}
                    {tabValue === 1 && (
                        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom align="center" sx={{ mb: 4 }}>
                                Datos del Nuevo Empleado
                            </Typography>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                            {/* Usamos STACK para las filas verticales */}
                            <Stack spacing={3}>
                                
                                {/* FILA 1: Usuario y Nombre */}
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField fullWidth label="Usuario (Login)" name="username" value={formData.username} onChange={handleChange} required sx={{ flex: 1 }} />
                                    <TextField fullWidth label="Nombre" name="first_name" value={formData.first_name} onChange={handleChange} required sx={{ flex: 1 }} />
                                </Box>

                                {/* FILA 2: Apellido y Correo */}
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField fullWidth label="Apellido" name="last_name" value={formData.last_name} onChange={handleChange} required sx={{ flex: 1 }} />
                                    <TextField fullWidth type="email" label="Correo Electrónico" name="email" value={formData.email} onChange={handleChange} required sx={{ flex: 1 }} />
                                </Box>

                                {/* FILA 3: Contraseña y ROL (EL IMPORTANTE) */}
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField fullWidth type="password" label="Contraseña" name="password" value={formData.password} onChange={handleChange} required sx={{ flex: 1 }} />
                                    
                                    {/* SELECTOR DE ROL FORZADO CON FLEX: 1 */}
                                    <TextField
                                        select
                                        label="Rol Asignado"
                                        name="rol"
                                        value={formData.rol}
                                        onChange={handleChange}
                                        required
                                        sx={{ flex: 1 }} // <--- ESTO OBLIGA A QUE CREZCA
                                        InputProps={{ sx: { height: '100%' } }} // Asegura altura consistente
                                    >
                                        <MenuItem value="Tecnico">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <BuildIcon color="warning" fontSize="small"/> Técnico
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="Supervisor">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <SupervisorAccountIcon color="secondary" fontSize="small"/> Supervisor
                                            </Box>
                                        </MenuItem>
                                    </TextField>
                                </Box>

                                {/* BOTÓN CENTRADO */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Button type="submit" variant="contained" size="large" sx={{ minWidth: 300, borderRadius: 2, fontSize: '1rem', fontWeight: 'bold' }}>
                                        Guardar Nuevo Personal
                                    </Button>
                                </Box>

                            </Stack>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}