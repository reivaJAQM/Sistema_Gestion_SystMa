import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, CardActions, 
  Button, Grid, Chip, CircularProgress, Tabs, Tab, Alert, Snackbar 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function MisTrabajos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); 
  const [estados, setEstados] = useState([]); 
  
  // Eliminamos el estado 'notificacion' si ya no lo vamos a usar para el inicio rápido
  // const [notificacion, setNotificacion] = useState({ open: false, mensaje: '' });
  
  const navigate = useNavigate();
  const currentUserId = parseInt(localStorage.getItem('user_id'));
  const userRol = localStorage.getItem('user_rol');

  useEffect(() => {
    if (userRol !== 'Tecnico') {
        alert("Acceso denegado. Esta sección es exclusiva para el personal técnico.");
        navigate('/dashboard');
        return;
    }
    fetchDatos();
  }, [userRol, navigate]);

  const fetchDatos = async () => {
    try {
      const [resOrdenes, resEstados] = await Promise.all([
        api.get('ordenes/'),
        api.get('estados/')
      ]);
      const misOrdenes = resOrdenes.data.filter(orden => orden.tecnico === currentUserId);
      setOrdenes(misOrdenes);
      setEstados(resEstados.data);
    } catch (error) {
      console.error("Error cargando datos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // --- SE ELIMINÓ LA FUNCIÓN handleIniciarTrabajo ---
  // Ahora la acción de iniciar se hace exclusivamente dentro del detalle.

  const pendientes = ordenes.filter(o => o.estado_data?.nombre !== 'Finalizado');
  const historial = ordenes.filter(o => o.estado_data?.nombre === 'Finalizado');

  const RenderLista = ({ lista, esHistorial }) => {
    if (lista.length === 0) {
      return (
        <Box sx={{ mt: 5, textAlign: 'center', opacity: 0.7 }}>
            <Typography variant="h6">
                {esHistorial 
                    ? "Aún no tienes trabajos finalizados." 
                    : "¡Todo limpio! No tienes trabajos asignados."}
            </Typography>
        </Box>
      );
    }

    return (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {lista.map((orden) => {
            return (
              <Grid item xs={12} md={6} lg={4} key={orden.id}>
                <Card elevation={esHistorial ? 1 : 4} sx={{ 
                    borderLeft: `6px solid ${orden.estado_data ? orden.estado_data.color : '#ccc'}`,
                    transition: '0.3s',
                    bgcolor: esHistorial ? '#f9f9f9' : 'white',
                    '&:hover': { transform: 'translateY(-3px)' }
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {orden.titulo}
                        </Typography>
                        {esHistorial && <Chip label="Finalizado" size="small" color="success" variant="outlined" />}
                    </Box>
                    
                    {!esHistorial && (
                        <Chip 
                          label={orden.estado_data ? orden.estado_data.nombre : 'Sin Estado'} 
                          size="small" 
                          sx={{ mb: 2, bgcolor: orden.estado_data?.color, color: 'white', fontWeight: 'bold' }} 
                        />
                    )}

                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                          <strong>Cliente:</strong> {orden.cliente_nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap title={orden.direccion}>
                          <strong>Ubicación:</strong> {orden.direccion || "Sin dirección"}
                      </Typography>
                      
                      {orden.fecha_inicio && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: '#1976d2', fontWeight: 500 }}>
                            📅 Programado: {new Date(orden.fecha_inicio).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  
                  {/* --- AQUÍ ESTÁ EL CAMBIO PRINCIPAL --- */}
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button 
                        variant="contained" // Usamos 'contained' para que resalte
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/trabajo/${orden.id}`)}
                        fullWidth 
                        sx={{ borderRadius: 2 }}
                    >
                        Ver Detalles
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
    );
  };

  if (userRol !== 'Tecnico') return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', mt:5 }}><CircularProgress /></Box>;
  if (!currentUserId) return <Alert severity="warning" sx={{ mt: 4 }}>Error: Usuario no identificado.</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#1a202c' }}>
        Mis Trabajos
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, mb: 2 }}>
        <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            centered variant="fullWidth"
            textColor="primary" indicatorColor="primary"
        >
          <Tab icon={<AssignmentIcon />} iconPosition="start" label={`Pendientes (${pendientes.length})`} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Historial Finalizados" />
        </Tabs>
      </Box>

      {tabValue === 0 && <RenderLista lista={pendientes} esHistorial={false} />}
      {tabValue === 1 && <RenderLista lista={historial} esHistorial={true} />}

    </Container>
  );
}