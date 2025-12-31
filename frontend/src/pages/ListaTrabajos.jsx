import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, CardActions, 
  Button, Grid, Chip, CircularProgress, TextField, InputAdornment, 
  MenuItem, FormControl, Select, InputLabel, Paper, IconButton, Tooltip 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh'; // Icono extra para recargar

import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ListaTrabajos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const location = useLocation(); 
  const [filtroEstado, setFiltroEstado] = useState(location.state?.filtro || 'Todos');

  const navigate = useNavigate();
  const userRol = localStorage.getItem('user_rol');

  useEffect(() => {
    if (userRol === 'Tecnico') {
      navigate('/calendario');
      return;
    }
    fetchDatos();
  }, [userRol, navigate]);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('ordenes/');
      setOrdenes(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error cargando lista", error);
    } finally {
      setLoading(false);
    }
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    const coincideTexto = 
        orden.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        orden.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = 
        filtroEstado === 'Todos' || 
        orden.estado_data?.nombre === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    // CAMBIO 1: maxWidth={false} permite que ocupe todo el ancho disponible
    <Container maxWidth={false} sx={{ mt: 2, mb: 4, px: { xs: 2, md: 4 } }}>
      
      {/* Encabezado y Navegación */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} color="inherit">
          Volver
        </Button>
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Gestión de Órdenes de Trabajo
        </Typography>
        <Tooltip title="Recargar datos">
            <IconButton onClick={fetchDatos}>
                <RefreshIcon />
            </IconButton>
        </Tooltip>
      </Box>

      {/* CAMBIO 2: Barra de Herramientas en un Paper para mejor UI */}
      <Paper elevation={2} sx={{ p: 2, mb: 4, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
            <Typography variant="subtitle1" fontWeight="bold">
                {filtroEstado === 'Todos' ? 'Vista General' : `Filtrado por: ${filtroEstado}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {ordenesFiltradas.length} órdenes encontradas
            </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                    value={filtroEstado}
                    label="Estado"
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />}
                >
                    <MenuItem value="Todos">Todos</MenuItem>
                    <MenuItem value="Pendiente">Pendientes</MenuItem>
                    <MenuItem value="En Progreso">En Ejecución</MenuItem>
                    <MenuItem value="En Revisión">En Revisión</MenuItem>
                    <MenuItem value="Finalizado">Finalizados</MenuItem>
                </Select>
            </FormControl>

            <TextField
                placeholder="Buscar cliente o título..."
                variant="outlined"
                size="small"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                sx={{ minWidth: 250 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />
        </Box>
      </Paper>

      {/* Grid de Resultados */}
      <Grid container spacing={3}>
        {ordenesFiltradas.length > 0 ? (
            ordenesFiltradas.map((orden) => (
                // CAMBIO 3: Ajuste de breakpoints. xl={2.4} o lg={3} para pantallas anchas
                <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={orden.id}>
                    <Card elevation={3} sx={{ 
                        borderLeft: `6px solid ${orden.estado_data?.color || '#ccc'}`,
                        height: '100%', display: 'flex', flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s', 
                        '&:hover': { 
                            transform: 'translateY(-4px)',
                            boxShadow: 6 
                        }
                    }}>
                        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                <Chip label={`#${orden.id}`} size="small" variant="outlined" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
                                <Chip 
                                    label={orden.estado_data?.nombre || 'N/A'} 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: `${orden.estado_data?.color}20`, // Color con transparencia de fondo
                                        color: orden.estado_data?.color, 
                                        fontWeight: 'bold',
                                        border: `1px solid ${orden.estado_data?.color}`
                                    }} 
                                />
                            </Box>
                            
                            <Typography variant="subtitle1" fontWeight="800" gutterBottom sx={{ lineHeight: 1.3, minHeight: '3rem' }}>
                                {orden.titulo}
                            </Typography>

                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" noWrap>{orden.cliente_nombre}</Typography>
                                </Box>
                                
                                <Box display="flex" alignItems="center" gap={1}>
                                    <EngineeringIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {orden.tecnico_nombre || "Sin Asignar"}
                                    </Typography>
                                </Box>

                                <Box display="flex" alignItems="center" gap={1}>
                                    <CalendarMonthIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {orden.fecha_inicio ? new Date(orden.fecha_inicio).toLocaleDateString() : '---'}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                        
                        <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button 
                                variant="contained" 
                                fullWidth 
                                startIcon={<VisibilityIcon />}
                                onClick={() => navigate(`/trabajo/${orden.id}`)}
                                sx={{ 
                                    bgcolor: 'text.primary',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    '&:hover': { bgcolor: 'primary.main' }
                                }} 
                            >
                                Ver Detalle
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            ))
        ) : (
            <Box sx={{ width: '100%', textAlign: 'center', mt: 8, opacity: 0.6 }}>
                <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No se encontraron órdenes</Typography>
                <Button sx={{ mt: 2 }} variant="outlined" onClick={() => { setFiltroEstado('Todos'); setBusqueda(''); }}>
                    Limpiar Filtros
                </Button>
            </Box>
        )}
      </Grid>
    </Container>
  );
}