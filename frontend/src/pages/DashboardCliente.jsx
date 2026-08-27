import React, { useEffect, useState, useCallback } from 'react';
import { 
  Container, Paper, Typography, Box, CircularProgress, 
  Card, CardContent, Divider, Chip, Grid, Button, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import AssignmentIcon from '@mui/icons-material/Assignment';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function DashboardCliente() {
  const [loading, setLoading] = useState(true);
  const [ordenes, setOrdenes] = useState([]);
  const [stats, setStats] = useState({ total: 0, enProgreso: 0, enRevision: 0, finalizados: 0 });
  const navigate = useNavigate();
  
  const usuario = localStorage.getItem('user_name');
  const userId = parseInt(localStorage.getItem('user_id'));

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get(`ordenes/?cliente=${userId}`);
      setOrdenes(data);
      
      const total = data.length;
      const enProgreso = data.filter(o => ['En Progreso', 'Pendiente'].includes(o.estado_data?.nombre)).length;
      const enRevision = data.filter(o => o.estado_data?.nombre === 'En Revisión').length;
      const finalizados = data.filter(o => o.estado_data?.nombre === 'Finalizado').length;
      
      setStats({ total, enProgreso, enRevision, finalizados });
    } catch (error) {
      console.error("Error cargando dashboard cliente", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const KpiCard = ({ title, value, icon, color }) => (
    <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: `${color}15`, p: 1.5, borderRadius: 2, color }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="800" color="#2D3748">{value}</Typography>
            <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>{title}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  const ordenesActivas = ordenes.filter(o => o.estado_data?.nombre !== 'Finalizado');
  const ordenesFinalizadas = ordenes.filter(o => o.estado_data?.nombre === 'Finalizado');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="900" sx={{ color: '#1a202c' }}>
          Hola, {usuario} 👋
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#718096', mt: 0.5 }}>
          Aquí puedes ver el estado de tus solicitudes de trabajo
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Total Solicitudes" value={stats.total} icon={<AssignmentIcon />} color="#5c6bc0" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="En Progreso" value={stats.enProgreso} icon={<EngineeringIcon />} color="#0070f3" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="En Revisión" value={stats.enRevision} icon={<HourglassEmptyIcon />} color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Finalizados" value={stats.finalizados} icon={<CheckCircleIcon />} color="#10b981" />
        </Grid>
      </Grid>

      {/* Órdenes Activas */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.06)', mb: 3 }}>
        <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 2 }}>
          Solicitudes Activas
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {ordenesActivas.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No tienes solicitudes activas en este momento.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {ordenesActivas.map(orden => (
              <Grid item xs={12} md={6} key={orden.id}>
                <Card 
                  sx={{ 
                    borderLeft: `5px solid ${orden.estado_data?.color || '#ccc'}`,
                    cursor: 'pointer',
                    transition: '0.2s',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => navigate(`/trabajo/${orden.id}`)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{orden.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Técnico: {orden.tecnico_nombre || 'Por asignar'}
                        </Typography>
                        {orden.fecha_inicio && (
                          <Typography variant="caption" color="#1976d2">
                            📅 {new Date(orden.fecha_inicio).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={orden.estado_data?.nombre} 
                          size="small" 
                          sx={{ bgcolor: orden.estado_data?.color, color: 'white', fontWeight: 'bold' }} 
                        />
                        <VisibilityIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Historial Finalizados */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
        <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 2 }}>
          Historial de Trabajos Finalizados
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {ordenesFinalizadas.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            Aún no tienes trabajos finalizados.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {ordenesFinalizadas.map(orden => (
              <Grid item xs={12} md={6} key={orden.id}>
                <Card 
                  sx={{ 
                    borderLeft: '5px solid #4CAF50',
                    bgcolor: '#f9f9f9',
                    cursor: 'pointer',
                    transition: '0.2s',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => navigate(`/trabajo/${orden.id}`)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{orden.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Técnico: {orden.tecnico_nombre}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Finalizado" size="small" color="success" variant="outlined" />
                        <VisibilityIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
}
