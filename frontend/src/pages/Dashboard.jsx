import React, { useEffect, useState } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, CircularProgress, 
  Card, CardContent, Divider, Button, Alert 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Iconos
import AssignmentIcon from '@mui/icons-material/Assignment';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    en_revision: 0,
    finalizados: 0
  });
  const [dataGrafica, setDataGrafica] = useState([]);
  const navigate = useNavigate();
  const usuario = localStorage.getItem('user_name');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('ordenes/');
      
      const total = data.length;
      const pendientes = data.filter(o => o.estado_data?.nombre === 'Pendiente').length;
      const en_proceso = data.filter(o => o.estado_data?.nombre === 'En Progreso').length;
      const en_revision = data.filter(o => o.estado_data?.nombre === 'En Revisión').length;
      const finalizados = data.filter(o => o.estado_data?.nombre === 'Finalizado').length;

      setStats({ total, pendientes, en_proceso, en_revision, finalizados });

      setDataGrafica([
        { name: 'Pendientes', cantidad: pendientes, color: '#9e9e9e' },
        { name: 'En Progreso', cantidad: en_proceso, color: '#1976d2' },
        { name: 'En Revisión', cantidad: en_revision, color: '#ed6c02' },
        { name: 'Finalizados', cantidad: finalizados, color: '#2e7d32' },
      ]);

    } catch (error) {
      console.error("Error cargando dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENTE DE TARJETA MODIFICADO ---
  const KpiCard = ({ title, value, icon, color, onClick }) => (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%', 
        borderLeft: `5px solid ${color}`, 
        cursor: onClick ? 'pointer' : 'default',
        transition: '0.3s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}> {/* Aumentamos un poco el padding interno */}
        
        {/* 1. Título arriba, separado */}
        <Typography color="textSecondary" variant="overline" fontWeight="bold" display="block" gutterBottom>
            {title}
        </Typography>
        
        {/* 2. Contenedor Flex SOLO para el Número y el Icono */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <Typography variant="h3" fontWeight="bold" sx={{ lineHeight: 1 }}>
               {value}
           </Typography>
           
           {/* El icono ahora se centra perfectamente respecto al número */}
           <Box sx={{ color: color, opacity: 0.8, display: 'flex' }}>
               {icon}
           </Box>
        </Box>

      </CardContent>
    </Card>
  );

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      
      {/* --- BANNER DE BIENVENIDA --- */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Hola, {usuario} 👋
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
                Aquí tienes el resumen general de las operaciones.
            </Typography>
        </Box>
        <Box display="flex" gap={2}>
             <Button 
                variant="contained" 
                startIcon={<CalendarMonthIcon />}
                onClick={() => navigate('/calendario')}
             >
                Ver Calendario
             </Button>
        </Box>
      </Box>

      {/* --- KPIS (CENTRADO) --- */}
      <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Total Trabajos" value={stats.total} icon={<AssignmentIcon fontSize="large"/>} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="En Ejecución" value={stats.en_proceso} icon={<EngineeringIcon fontSize="large"/>} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Requieren Revisión" value={stats.en_revision} icon={<WarningIcon fontSize="large"/>} color="#ed6c02" onClick={() => navigate('/panel-supervisor')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Finalizados" value={stats.finalizados} icon={<CheckCircleIcon fontSize="large"/>} color="#2e7d32" />
        </Grid>
      </Grid>

      {/* --- GRÁFICA Y ALERTAS (CENTRADO) --- */}
      <Grid container spacing={3} justifyContent="center">
        
        <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Resumen de Estado de Órdenes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataGrafica} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Legend />
                        <Bar dataKey="cantidad" name="Cantidad de Órdenes" radius={[5, 5, 0, 0]}>
                            {dataGrafica.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '400px', overflowY: 'auto' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom color={stats.en_revision > 0 ? "warning.main" : "text.primary"}>
                    ⚠️ Centro de Atención
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {stats.en_revision === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.6 }}>
                        <CheckCircleIcon sx={{ fontSize: 60, color: 'success.light' }} />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            Todo al día. No hay revisiones pendientes.
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Tienes <strong>{stats.en_revision} órdenes</strong> esperando aprobación del supervisor.
                        </Alert>
                        <Button 
                            variant="contained" 
                            color="warning" 
                            fullWidth
                            onClick={() => navigate('/panel-supervisor')}
                        >
                            Ir a Aprobar Trabajos
                        </Button>
                    </Box>
                )}
            </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}