import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, CardActions, 
  Button, Grid, Chip, CircularProgress 
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function MisTrabajos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Obtenemos el ID del usuario actual (asumiendo que guardaste el ID al loguear, 
  // si no, filtraremos en el cliente por nombre por ahora)
  const currentUserName = localStorage.getItem('user_name');

  useEffect(() => {
    fetchMisTrabajos();
  }, []);

  const fetchMisTrabajos = async () => {
    try {
      const response = await api.get('ordenes/');
      // Filtramos: Que sea mi usuario Y que el trabajo no esté Finalizado (o sí, para historial)
      // Ajusta la lógica según prefieras ver solo los activos o todos.
      const misOrdenes = response.data.filter(orden => 
        orden.tecnico_nombre === currentUserName
      );
      setOrdenes(misOrdenes);
    } catch (error) {
      console.error("Error cargando trabajos", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', mt:5 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Mis Trabajos Asignados
      </Typography>

      {ordenes.length === 0 ? (
        <Typography variant="body1">No tienes trabajos asignados actualmente.</Typography>
      ) : (
        <Grid container spacing={3}>
          {ordenes.map((orden) => (
            <Grid item xs={12} md={6} lg={4} key={orden.id}>
              <Card elevation={3} sx={{ borderLeft: `6px solid ${orden.estado_data ? orden.estado_data.color : '#ccc'}` }}>
                <CardContent>
                  <Typography variant="h6" component="div" gutterBottom>
                    {orden.titulo}
                  </Typography>
                  <Chip 
                    label={orden.estado_data ? orden.estado_data.nombre : 'Sin Estado'} 
                    size="small" 
                    sx={{ mb: 2, bgcolor: orden.estado_data?.color, color: 'white' }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Cliente:</strong> {orden.cliente_nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Dirección:</strong> {orden.direccion}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Inicio: {new Date(orden.fecha_inicio).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    variant="contained" 
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/trabajo/${orden.id}`)}
                    fullWidth
                  >
                    Ver Bitácora / Avances
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}