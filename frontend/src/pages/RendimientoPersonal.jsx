import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, Card, CardContent, 
  Divider, CircularProgress, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, Cell 
} from 'recharts';
import api from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="900" sx={{ color: '#1a202c' }}>
          Rendimiento del Personal Técnico
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#718096' }}>
          Análisis de productividad, eficiencia y calidad de servicio
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico de Productividad */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Trabajos Finalizados
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="finalizados" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Tiempo Promedio */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Tiempo Promedio de Resolución (Horas)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKye="nombre" dataKey="nombre" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tiempo_promedio_horas" fill="#0070f3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla Detallada */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          Métricas Detalladas por Técnico
        </Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Técnico</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Trabajos</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Finalizados</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Eficiencia (%)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>T. Promedio (h)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Rechazos</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tasa Rechazo (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((tech) => (
                <TableRow key={tech.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{tech.nombre}</TableCell>
                  <TableCell align="center">{tech.total_trabajos}</TableCell>
                  <TableCell align="center">{tech.finalizados}</TableCell>
                  <TableCell align="center">
                    <Chip label={`${tech.eficiencia}%`} color={tech.eficiencia > 80 ? "success" : tech.eficiencia > 50 ? "warning" : "error"} size="small" />
                  </TableCell>
                  <TableCell align="center">{tech.tiempo_promedio_horas}</TableCell>
                  <TableCell align="center" sx={{ color: tech.rechazos > 0 ? 'error.main' : 'inherit' }}>{tech.rechazos}</TableCell>
                  <TableCell align="center">{tech.tasa_rechazo}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
