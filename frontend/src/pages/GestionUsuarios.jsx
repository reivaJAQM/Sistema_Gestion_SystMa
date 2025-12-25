import React, { useState } from 'react';
import { 
    Container, TextField, Button, Typography, Paper, 
    Grid, FormControl, InputLabel, Select, MenuItem, Alert 
} from '@mui/material';
import api from '../services/api';

export default function GestionUsuarios() {
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        rol: '' 
    });
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje(null);
        setError(null);

        try {
            await api.post('crear-usuario/', formData);
            setMensaje("Usuario creado correctamente.");
            setFormData({
                username: '', first_name: '', last_name: '', 
                email: '', password: '', rol: ''
            });
        } catch (err) {
            console.error(err);
            setError("Error al crear usuario. Verifica que el nombre de usuario no exista.");
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Registrar Nuevo Personal
                </Typography>
                
                {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Usuario (Login)" name="username" value={formData.username} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Nombre" name="first_name" value={formData.first_name} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Apellido" name="last_name" value={formData.last_name} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth type="email" label="Correo Electrónico" name="email" value={formData.email} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth type="password" label="Contraseña" name="password" value={formData.password} onChange={handleChange} required />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    name="rol"
                                    value={formData.rol}
                                    label="Rol"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Tecnico">Técnico</MenuItem>
                                    <MenuItem value="Supervisor">Supervisor</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" color="primary" fullWidth size="large">
                                Crear Usuario
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
}