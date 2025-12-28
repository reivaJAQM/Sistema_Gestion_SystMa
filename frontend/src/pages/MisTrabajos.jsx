import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, CardActions, 
  Button, Grid, Chip, CircularProgress, Tabs, Tab, Alert 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function MisTrabajos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0 = Pendientes, 1 = Historial
  const navigate = useNavigate();
  
  // Mantenemos la corrección: Usamos ID, no nombre
  const currentUserId = parseInt(localStorage.getItem('user_id'));

  useEffect(() => {
    fetchMisTrabajos();
  }, []);

  const fetchMisTrabajos = async () => {
    try {
      const response = await api.get('ordenes/');
      
      // Filtramos solo las órdenes de este técnico
      const misOrdenes = response.data.filter(orden => 
        orden.tecnico === currentUserId
      );
      
      setOrdenes(misOrdenes);
    } catch (error) {
      console.error("Error cargando trabajos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // --- LÓGICA DE SEPARACIÓN ---
  // Asumimos que el estado final se llama exactamente 'Finalizado'
  const pendientes = ordenes.filter(o => o.estado_data?.nombre !== 'Finalizado');
  const historial = ordenes.filter(o => o.estado_data?.nombre === 'Finalizado');

  // Componente auxiliar para renderizar la lista de tarjetas
  const RenderLista = ({ lista, esHistorial }) => {
    if (lista.length === 0) {
      return (
        <Box sx={{ mt: 5, textAlign: 'center', opacity: 0.7 }}>
            <Typography variant="h6">
                {esHistorial 
                    ? "Aún no tienes trabajos finalizados en el historial." 
                    : "¡Todo limpio! No tienes trabajos pendientes."}
            </Typography>
        </Box>
      );
    }

    return (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {lista.map((orden) => (
            <Grid item xs={12} md={6} lg={4} key={orden.id}>
              <Card elevation={esHistorial ? 1 : 4} sx={{ 
                  borderLeft: `6px solid ${orden.estado_data ? orden.estado_data.color : '#ccc'}`,
                  transition: '0.3s',
                  bgcolor: esHistorial ? '#f9f9f9' : 'white', // Fondo grisáceo si es historial
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
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: '#1976d2', fontWeight: 500 }}>
                        📅 Inicio: {new Date(orden.fecha_inicio).toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button 
                    variant={esHistorial ? "outlined" : "contained"} 
                    color={esHistorial ? "secondary" : "primary"}
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/trabajo/${orden.id}`)}
                    fullWidth
                    sx={{ borderRadius: 2 }}
                  >
                    {esHistorial ? "Ver Detalles Antiguos" : "Gestionar / Bitácora"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
    );
  };

  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', mt:5 }}><CircularProgress /></Box>;
  if (!currentUserId) return <Alert severity="warning" sx={{ mt: 4 }}>Error: Usuario no identificado. Cierra sesión e intenta de nuevo.</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#1a202c' }}>
        Mis Trabajos
      </Typography>

      {/* --- PESTAÑAS SUPERIORES --- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, mb: 2 }}>
        <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            centered 
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
        >
          <Tab icon={<AssignmentIcon />} iconPosition="start" label={`Pendientes (${pendientes.length})`} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Historial Finalizados" />
        </Tabs>
      </Box>

      {/* --- CONTENIDO SEGÚN PESTAÑA --- */}
      {tabValue === 0 && <RenderLista lista={pendientes} esHistorial={false} />}
      {tabValue === 1 && <RenderLista lista={historial} esHistorial={true} />}

    </Container>
  );
}