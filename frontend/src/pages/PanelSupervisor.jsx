import React, { useEffect, useState } from 'react';
import { 
    Container, Typography, Grid, Card, CardContent, CardActions, 
    Button, Chip, Box, CircularProgress, Divider, Stack 
} from '@mui/material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// Iconos
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export default function PanelSupervisor() {
    const navigate = useNavigate();
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listaEstados, setListaEstados] = useState([]); // Para buscar IDs
    const usuarioNombre = localStorage.getItem('user_name');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resOrdenes, resEstados] = await Promise.all([
                api.get('ordenes/'),
                api.get('estados/')
            ]);
            
            setListaEstados(resEstados.data);

            // Filtramos las del supervisor y ordenamos por importancia
            // Prioridad: "En Revisión" primero
            const misOrdenes = resOrdenes.data
                .filter(o => o.supervisor_nombre === usuarioNombre)
                .sort((a, b) => {
                    if (a.estado_data?.nombre === 'En Revisión') return -1;
                    if (b.estado_data?.nombre === 'En Revisión') return 1;
                    return 0;
                });
            
            setOrdenes(misOrdenes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstado = async (ordenId, nuevoNombreEstado) => {
        if(!confirm(`¿Estás seguro de cambiar el estado a "${nuevoNombreEstado}"?`)) return;

        const estadoObj = listaEstados.find(e => e.nombre === nuevoNombreEstado);
        if (!estadoObj) return alert("Estado no encontrado");

        try {
            await api.patch(`ordenes/${ordenId}/`, { estado: estadoObj.id });
            fetchData(); // Recargar lista
        } catch (error) {
            console.error(error);
            alert("Error al actualizar");
        }
    };

    const verDetalle = (id) => {
        navigate(`/trabajo/${id}`);
    };

    if (loading) return <Box sx={{ display:'flex', justifyContent:'center', mt:5 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIndIcon fontSize="large" color="primary" />
                <Typography variant="h4" fontWeight="bold">
                    Panel de Supervisión
                </Typography>
            </Box>

            {ordenes.length === 0 ? (
                <Typography variant="h6" color="textSecondary" align="center">
                    Todo limpio. No tienes órdenes pendientes de supervisión.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {ordenes.map((orden) => {
                        const esRevision = orden.estado_data?.nombre === 'En Revisión';

                        return (
                            <Grid item xs={12} md={6} lg={4} key={orden.id}>
                                <Card elevation={esRevision ? 8 : 2} sx={{ 
                                    borderLeft: `6px solid ${orden.estado_data?.color || '#ccc'}`,
                                    transform: esRevision ? 'scale(1.02)' : 'none', // Destacar visualmente
                                    transition: '0.2s'
                                }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" mb={1}>
                                            <Chip 
                                                label={orden.estado_data?.nombre || 'Indefinido'} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: orden.estado_data?.color, 
                                                    color: 'white', 
                                                    fontWeight: 'bold' 
                                                }}
                                            />
                                            <Typography variant="caption" color="textSecondary">#{orden.id}</Typography>
                                        </Box>
                                        
                                        <Typography variant="h6" gutterBottom noWrap title={orden.titulo}>
                                            {orden.titulo}
                                        </Typography>
                                        
                                        <Box mt={2} sx={{ fontSize: '0.9rem' }}>
                                            <Typography variant="body2"><strong>Técnico:</strong> {orden.tecnico_nombre}</Typography>
                                            <Typography variant="body2"><strong>Cliente:</strong> {orden.cliente_nombre}</Typography>
                                        </Box>
                                    </CardContent>

                                    <Divider />

                                    <CardActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
                                        {/* BOTONES DE ACCIÓN (SOLO SI ESTÁ EN REVISIÓN) */}
                                        {esRevision ? (
                                            <Stack direction="row" spacing={1} width="100%">
                                                <Button 
                                                    fullWidth variant="contained" color="success"
                                                    startIcon={<CheckCircleIcon />}
                                                    onClick={() => cambiarEstado(orden.id, 'Finalizado')}
                                                >
                                                    Aprobar
                                                </Button>
                                                <Button 
                                                    fullWidth variant="outlined" color="error"
                                                    startIcon={<CancelIcon />}
                                                    onClick={() => cambiarEstado(orden.id, 'En Progreso')}
                                                >
                                                    Rechazar
                                                </Button>
                                            </Stack>
                                        ) : (
                                            <Typography variant="caption" color="textSecondary" sx={{fontStyle:'italic'}}>
                                                {orden.estado_data?.nombre === 'Finalizado' 
                                                    ? 'Trabajo Finalizado' 
                                                    : 'Esperando terminación del técnico...'}
                                            </Typography>
                                        )}

                                        <Button 
                                            fullWidth size="small" 
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => verDetalle(orden.id)}
                                            sx={{ mt: 1 }}
                                        >
                                            Ver Detalles y Fotos
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Container>
    );
}