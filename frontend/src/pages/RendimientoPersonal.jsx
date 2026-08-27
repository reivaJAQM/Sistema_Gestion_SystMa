import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, Card, CardContent, 
  CircularProgress, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import api from '../services/api';

import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import StarIcon from '@mui/icons-material/Star';

export default function RendimientoPersonal() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const { data } = await api.get('analiticas/rendimiento/');
      setData(data);
    } catch (error) {
      console.error("Error cargando analíticas", error);
    } finally {
      setLoading(false);
    }
  };

  const totalFinalizados = data.reduce((acc, t) => acc + t.finalizados, 0);
  const eficienciaPromedio = data.length > 0 ? Math.round(data.reduce((acc, t) => acc + t.eficiencia, 0) / data.length) : 0;
  const tiempoPromedioGlobal = data.length > 0 ? (data.reduce((acc, t) => acc + t.tiempo_promedio_horas, 0) / data.length).toFixed(1) : 0;
  const totalRechazos = data.reduce((acc, t) => acc + t.rechazos, 0);

  const radarData = data.map(tech => ({
    nombre: tech.nombre.split(' ')[0],
    finalizados: tech.finalizados,
    eficiencia: tech.eficiencia,
    velocidad: Math.max(0, 100 - tech.tiempo_promedio_horas * 5),
    calidad: Math.max(0, 100 - tech.tasa_rechazo * 10),
  }));

  const KpiCard = ({ title, value, icon, color, subtitle }) => (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: '24px', 
        boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)', 
        border: '1px solid rgba(255, 255, 255, 0.6)',
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: `linear-gradient(to bottom, ${color}, ${color}88)`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}> 
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
           <Box sx={{ 
               bgcolor: `${color}15`, 
               p: 1.5, borderRadius: '16px', color: color, 
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               boxShadow: `0 4px 12px ${color}30` 
           }}>
               {icon}
           </Box>
           <Box>
             <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600 }}>
               {title}
             </Typography>
             <Typography variant="h4" fontWeight="800" sx={{ color: '#2D3748', letterSpacing: '-0.02em' }}>
               {value}
             </Typography>
             {subtitle && (
               <Typography variant="caption" sx={{ color: '#A0AEC0', fontWeight: 500 }}>
                 {subtitle}
               </Typography>
             )}
           </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="body2" fontWeight="bold" sx={{ color: '#2D3748', mb: 0.5 }}>
            {payload[0].payload.nombre}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="caption" sx={{ display: 'block', color: entry.fill }}>
              {entry.name}: <strong>{entry.value}</strong>
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', pb: 4 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#1a202c', letterSpacing: '-0.03em' }}>
            Rendimiento del Equipo Técnico
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#718096', mt: 0.5 }}>
            Análisis de productividad, eficiencia y calidad de servicio
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, 
          gap: 3, mb: 4 
        }}>
          <KpiCard 
            title="Total Finalizados" value={totalFinalizados} 
            icon={<CheckCircleIcon />} color="#10b981" 
            subtitle="trabajos completados"
          />
          <KpiCard 
            title="Eficiencia Promedio" value={`${eficienciaPromedio}%`} 
            icon={<StarIcon />} color="#5c6bc0" 
            subtitle="rendimiento global"
          />
          <KpiCard 
            title="Tiempo Promedio" value={`${tiempoPromedioGlobal}h`} 
            icon={<TimerIcon />} color="#0070f3" 
            subtitle="por trabajo"
          />
          <KpiCard 
            title="Total Rechazos" value={totalRechazos} 
            icon={<WarningIcon />} color={totalRechazos > 0 ? '#f59e0b' : '#10b981'} 
            subtitle="en revisión"
          />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ 
              p: 3, minHeight: '360px', borderRadius: '24px', 
              boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              display: 'flex', flexDirection: 'column',
              height: '100%'
            }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 1 }}>
                Trabajos Finalizados por Técnico
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A0AEC0', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A0AEC0' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7FAFC' }} />
                  <Bar dataKey="finalizados" radius={[8, 8, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? '#10b981' : '#34d399'}
                        style={{ filter: `drop-shadow(0 2px 4px ${index % 2 === 0 ? '#10b98140' : '#34d39940'})` }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ 
              p: 3, minHeight: '360px', borderRadius: '24px', 
              boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              display: 'flex', flexDirection: 'column',
              height: '100%'
            }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 1 }}>
                Perfil de Rendimiento
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#718096', fontWeight: 600 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: '#A0AEC0' }} domain={[0, 100]} />
                  <Radar name="Finalizados" dataKey="finalizados" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name="Eficiencia" dataKey="eficiencia" stroke="#5c6bc0" fill="#5c6bc0" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name="Velocidad" dataKey="velocidad" stroke="#0070f3" fill="#0070f3" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ 
              p: 3, minHeight: '360px', borderRadius: '24px', 
              boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              display: 'flex', flexDirection: 'column',
              height: '100%'
            }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 1 }}>
                Tiempo Promedio de Resolución (Horas)
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                  <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#A0AEC0', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A0AEC0' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7FAFC' }} />
                  <Bar dataKey="tiempo_promedio_horas" radius={[8, 8, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? '#0070f3' : '#3b82f6'}
                        style={{ filter: `drop-shadow(0 2px 4px ${index % 2 === 0 ? '#0070f340' : '#3b82f640'})` }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ 
              p: 3, minHeight: '360px', borderRadius: '24px', 
              boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              display: 'flex', flexDirection: 'column',
              height: '100%'
            }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 1 }}>
                Eficiencia por Técnico (%)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', mt: 1 }}>
                {data.map((tech) => (
                  <Box key={tech.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="700" sx={{ color: '#2D3748' }}>
                        {tech.nombre}
                      </Typography>
                      <Typography variant="body2" fontWeight="800" sx={{ 
                        color: tech.eficiencia > 80 ? '#10b981' : tech.eficiencia > 50 ? '#f59e0b' : '#ef4444' 
                      }}>
                        {tech.eficiencia}%
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: '100%', height: 8, bgcolor: '#EDF2F7', borderRadius: 4, overflow: 'hidden' 
                    }}>
                      <Box sx={{ 
                        width: `${tech.eficiencia}%`, height: '100%', borderRadius: 4,
                        background: `linear-gradient(90deg, ${tech.eficiencia > 80 ? '#10b981' : tech.eficiencia > 50 ? '#f59e0b' : '#ef4444'}, ${tech.eficiencia > 80 ? '#34d399' : tech.eficiencia > 50 ? '#fbbf24' : '#f87171'})`,
                        transition: 'width 1s ease',
                      }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#A0AEC0' }}>
                      {tech.finalizados} finalizados · {tech.rechazos} rechazos
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Paper elevation={0} sx={{ 
          p: 3, borderRadius: '24px', 
          boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}>
          <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 3 }}>
            Métricas Detalladas
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F7FAFC' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#4A5568', borderRadius: '8px 0 0 8px' }}>Técnico</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#4A5568' }}>Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#4A5568' }}>Finalizados</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#4A5568' }}>Eficiencia</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#4A5568' }}>T. Promedio</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#4A5568', borderRadius: '0 8px 8px 0' }}>Rechazos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((tech) => (
                  <TableRow key={tech.id} hover sx={{ 
                    '&:last-child td': { borderBottom: 0 },
                    '&:hover': { bgcolor: '#F7FAFC' }
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          width: 36, height: 36, borderRadius: '10px', 
                          bgcolor: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#0070f3'
                        }}>
                          <EngineeringIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography fontWeight="700" sx={{ color: '#2D3748' }}>
                          {tech.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{tech.total_trabajos}</TableCell>
                    <TableCell align="center">
                      <Chip label={tech.finalizados} size="small" sx={{ 
                        bgcolor: '#DEF7EC', color: '#03543F', fontWeight: 700, borderRadius: '8px' 
                      }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${tech.eficiencia}%`} size="small" sx={{ 
                        bgcolor: tech.eficiencia > 80 ? '#DEF7EC' : tech.eficiencia > 50 ? '#FEF3C7' : '#FEE2E2',
                        color: tech.eficiencia > 80 ? '#03543F' : tech.eficiencia > 50 ? '#92400E' : '#991B1B',
                        fontWeight: 700, borderRadius: '8px' 
                      }} />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#4A5568' }}>
                      {tech.tiempo_promedio_horas}h
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 700, 
                      color: tech.rechazos > 0 ? '#EF4444' : '#10B981' 
                    }}>
                      {tech.rechazos}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}
