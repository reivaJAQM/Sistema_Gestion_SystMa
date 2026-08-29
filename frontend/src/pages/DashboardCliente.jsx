import React, { useEffect, useState, useCallback } from 'react';
import { 
  Container, Paper, Typography, Box, CircularProgress, 
  Card, CardContent, Divider, Chip, Grid, Button, Avatar, Stack
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
      const url = userId ? `ordenes/?cliente=${userId}` : 'ordenes/';
      const { data } = await api.get(url);
      const lista = Array.isArray(data) ? data : [];
      setOrdenes(lista);
      
      const total = lista.length;
      const enProgreso = lista.filter(o => ['En Progreso', 'Pendiente'].includes(o.estado_data?.nombre)).length;
      const enRevision = lista.filter(o => o.estado_data?.nombre === 'En Revisión').length;
      const finalizados = lista.filter(o => o.estado_data?.nombre === 'Finalizado').length;
      
      setStats({ total, enProgreso, enRevision, finalizados });
    } catch (error) {
      console.error("Error cargando dashboard cliente", error);
      setOrdenes([]);
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
          Hola, {usuario}
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
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a' }}>
            Solicitudes Activas ({ordenesActivas.length})
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {ordenesActivas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
            <Typography variant="body1" color="#64748b" fontWeight="600">
              No tienes solicitudes activas en este momento.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {ordenesActivas.map(orden => (
              <Grid item xs={12} md={6} key={orden.id}>
                <Card 
                  sx={{ 
                    borderRadius: 3.5,
                    border: '1px solid #e2e8f0',
                    borderLeft: `6px solid ${orden.estado_data?.color || '#3b82f6'}`,
                    cursor: 'pointer',
                    bgcolor: '#ffffff',
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    '&:hover': { 
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      borderColor: '#cbd5e1'
                    }
                  }}
                  onClick={() => navigate(`/trabajo/${orden.id}`)}
                >
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a', flex: 1 }}>
                        {orden.titulo}
                      </Typography>
                      <Chip 
                        label={orden.estado_data?.nombre} 
                        size="small" 
                        sx={{ 
                          bgcolor: orden.estado_data?.color || '#3b82f6', 
                          color: '#ffffff', 
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          height: 26,
                          px: 1,
                          flexShrink: 0
                        }} 
                      />
                    </Box>

                    <Stack spacing={1.2} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <strong>Técnico Asignado:</strong> 
                        <span style={{ color: orden.tecnico_nombre ? '#0f172a' : '#94a3b8' }}>
                          {orden.tecnico_nombre || 'Pendiente de asignación'}
                        </span>
                      </Typography>

                      {orden.fecha_inicio && (
                        <Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 600 }}>
                          Programado para: {new Date(orden.fecha_inicio).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                      )}

                      {orden.direccion && (
                        <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                          {orden.direccion}
                        </Typography>
                      )}
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, color: '#2563eb' }}>
                      <Typography variant="caption" fontWeight="800">Ver detalles de la orden</Typography>
                      <VisibilityIcon sx={{ fontSize: 16 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Historial Finalizados */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a', mb: 2 }}>
          Historial de Trabajos Finalizados ({ordenesFinalizadas.length})
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {ordenesFinalizadas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
            <Typography variant="body1" color="#64748b" fontWeight="600">
              Aún no tienes trabajos finalizados.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {ordenesFinalizadas.map(orden => (
              <Grid item xs={12} md={6} key={orden.id}>
                <Card 
                  sx={{ 
                    borderRadius: 3.5,
                    border: '1px solid #e2e8f0',
                    borderLeft: '6px solid #10b981',
                    bgcolor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    '&:hover': { 
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      borderColor: '#cbd5e1'
                    }
                  }}
                  onClick={() => navigate(`/trabajo/${orden.id}`)}
                >
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
                      <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a', flex: 1 }}>
                        {orden.titulo}
                      </Typography>
                      <Chip 
                        label="Finalizado" 
                        size="small" 
                        sx={{ 
                          bgcolor: '#dcfce7', 
                          color: '#15803d', 
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          border: '1px solid #86efac',
                          height: 26,
                          px: 1
                        }} 
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#475569', mb: 1.5 }}>
                      <strong>Técnico:</strong> {orden.tecnico_nombre || "SystMa Team"}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, color: '#16a34a' }}>
                      <Typography variant="caption" fontWeight="800">Ver reporte y evidencias</Typography>
                      <VisibilityIcon sx={{ fontSize: 16 }} />
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
