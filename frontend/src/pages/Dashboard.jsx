import React, { useEffect, useState } from 'react';
import { 
  Container, Paper, Typography, Box, CircularProgress, 
  Card, CardContent, Divider, Button, Alert
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Iconos
import AssignmentIcon from '@mui/icons-material/Assignment';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MoreVertIcon from '@mui/icons-material/MoreVert'; 
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // <--- NUEVO ICONO

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0, pendientes: 0, en_proceso: 0, en_revision: 0, finalizados: 0
  });
  const [dataGrafica, setDataGrafica] = useState([]);
  const navigate = useNavigate();
  
  const usuario = localStorage.getItem('user_name');
  const userRol = localStorage.getItem('user_rol');
  const userId = parseInt(localStorage.getItem('user_id'));

  useEffect(() => {
    if (userRol === 'Tecnico') {
        navigate('/calendario');
        return;
    }
    fetchData();
  }, [userRol, navigate]);

  const fetchData = async () => {
    try {
      const { data } = await api.get('ordenes/');
      
      const total = data.length;
      const pendientes = data.filter(o => o.estado_data?.nombre === 'Pendiente').length;
      const en_proceso = data.filter(o => o.estado_data?.nombre === 'En Progreso').length;
      const finalizados = data.filter(o => o.estado_data?.nombre === 'Finalizado').length;

      let en_revision = 0;
      if (userRol === 'Administrador') {
          en_revision = data.filter(o => o.estado_data?.nombre === 'En Revisión').length;
      } else if (userRol === 'Supervisor') {
          en_revision = data.filter(o => 
              o.estado_data?.nombre === 'En Revisión' && o.supervisor === userId
          ).length;
      }

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

  const KpiCard = ({ title, value, icon, color, onClick }) => (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: '24px', 
        boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)', 
        border: '1px solid rgba(255, 255, 255, 0.6)',
        background: '#ffffff',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible',
        '&:hover': { 
            transform: onClick ? 'translateY(-5px)' : 'none', 
            boxShadow: onClick ? '0px 20px 40px rgba(0,0,0, 0.08)' : '0px 10px 30px rgba(0,0,0, 0.04)'
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}> 
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
           <Box sx={{ 
               bgcolor: `${color}15`, 
               p: 1.5, borderRadius: '16px', color: color, 
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               boxShadow: `0 4px 12px ${color}30` 
           }}>
               {icon}
           </Box>
           {onClick && <MoreVertIcon sx={{ color: '#bdbdbd', fontSize: 20 }} />}
        </Box>

        <Box>
            <Typography variant="h4" fontWeight="800" sx={{ color: '#2D3748', letterSpacing: '-0.02em' }}>
                {value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600, mt: 0.5 }}>
                {title}
            </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (userRol === 'Tecnico') return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', pb: 4 }}>
        <Container maxWidth="xl" sx={{ pt: 4 }}>
        
        {/* --- HEADER CON NUEVOS BOTONES --- */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
                <Typography variant="h4" fontWeight="900" sx={{ color: '#1a202c', letterSpacing: '-0.03em' }}>
                    Hola, {usuario} 👋
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#718096', mt: 0.5 }}>
                    Resumen de operaciones · {new Date().toLocaleDateString()}
                </Typography>
            </Box>
            
            {/* Contenedor de Botones de Acción */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                    variant="contained" size="large"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => navigate('/nueva-orden')}
                    sx={{ 
                        borderRadius: '12px', textTransform: 'none', fontWeight: 'bold',
                        background: '#10b981', // Color verde esmeralda
                        '&:hover': { background: '#059669' }
                    }}
                >
                    Agendar Trabajo
                </Button>

                <Button 
                    variant="contained" size="large"
                    startIcon={<CalendarMonthIcon />}
                    onClick={() => navigate('/calendario')}
                    sx={{ 
                        borderRadius: '12px', textTransform: 'none', fontWeight: 'bold',
                        '&:hover': { background: '#0761d1' }
                    }}
                >
                    Ver Calendario
                </Button>
            </Box>
        </Box>

        {/* --- GRID DE KPIS --- */}
        <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, 
            gap: 3, mb: 4 
        }}>
            <KpiCard 
                title="Total Órdenes" value={stats.total} icon={<AssignmentIcon />} color="#5c6bc0" 
                onClick={() => navigate('/todos-los-trabajos')} 
            />
            <KpiCard 
                title="Pendientes" value={stats.pendientes} icon={<HourglassEmptyIcon />} color="#757575" 
                onClick={() => navigate('/todos-los-trabajos', { state: { filtro: 'Pendiente' } })}
            />
            <KpiCard 
                title="En Ejecución" value={stats.en_proceso} icon={<EngineeringIcon />} color="#0070f3" 
                onClick={() => navigate('/todos-los-trabajos', { state: { filtro: 'En Progreso' } })}
            />
            <KpiCard 
                title="Por Revisar" value={stats.en_revision} icon={<WarningIcon />} color="#f59e0b" 
                onClick={stats.en_revision > 0 ? () => navigate('/todos-los-trabajos', { state: { filtro: 'En Revisión' } }) : undefined} 
            />
            <KpiCard 
                title="Finalizados" value={stats.finalizados} icon={<CheckCircleIcon />} color="#10b981" 
                onClick={() => navigate('/todos-los-trabajos', { state: { filtro: 'Finalizado' } })}
            />
        </Box>

        {/* --- SECCIÓN INFERIOR --- */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            
            {/* GRÁFICA */}
            <Paper elevation={0} sx={{ 
                p: 3, height: '340px', borderRadius: '24px', 
                boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                display: 'flex', flexDirection: 'column' 
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748' }}>
                        Flujo de Trabajo
                    </Typography>
                </Box>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataGrafica} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A0AEC0', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A0AEC0' }} />
                        <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                        <Bar dataKey="cantidad" radius={[6, 6, 6, 6]} barSize={50}>
                            {dataGrafica.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Paper>

            {/* CENTRO DE ATENCIÓN */}
            <Paper elevation={0} sx={{ 
                p: 3, height: '340px', borderRadius: '24px', 
                boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                overflowY: 'auto' 
            }}>
                <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 2 }}>
                    Centro de Atención
                </Typography>
                <Divider sx={{ mb: 2, borderColor: '#edf2f7' }} />

                {stats.en_revision === 0 ? (
                    <Box sx={{ height: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ p: 2, bgcolor: '#DEF7EC', borderRadius: '50%', mb: 2 }}>
                            <VerifiedUserIcon sx={{ fontSize: 40, color: '#03543F' }} />
                        </Box>
                        <Typography variant="body1" fontWeight="bold" color="#2D3748">
                            Todo en orden
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Sin revisiones pendientes.
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px', '& .MuiAlert-icon': { fontSize: 24 } }}>
                            <strong>{stats.en_revision} órdenes</strong> requieren aprobación.
                        </Alert>
                        <Button 
                            variant="contained" color="warning" fullWidth size="large"
                            onClick={() => navigate('/todos-los-trabajos', { state: { filtro: 'En Revisión' } })}
                            sx={{ borderRadius: '12px', fontWeight: 'bold', boxShadow: 'none' }}
                        >
                            Revisar Ahora
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
        </Container>
    </Box>
  );
}