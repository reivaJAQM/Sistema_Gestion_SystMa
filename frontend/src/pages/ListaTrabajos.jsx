import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, CardActions, 
  Button, Grid, Chip, CircularProgress, TextField, InputAdornment, 
  MenuItem, FormControl, Select, InputLabel 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';

import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ListaTrabajos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const location = useLocation(); // Hook para leer lo que mandamos desde el Dashboard
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
    try {
      const { data } = await api.get('ordenes/');
      setOrdenes(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error cargando lista", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO COMBINADO ---
  const ordenesFiltradas = ordenes.filter(orden => {
    // 1. Filtro por Texto (Cliente o Título)
    const coincideTexto = 
        orden.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        orden.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase());

    // 2. Filtro por Estado (Dropdown o desde Dashboard)
    const coincideEstado = 
        filtroEstado === 'Todos' || 
        orden.estado_data?.nombre === filtroEstado;

    return coincideTexto && coincideEstado;
  });

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      
      {/* Botón Volver */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        Volver al Panel
      </Button>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
        <Box>
            <Typography variant="h4" fontWeight="bold">
                {filtroEstado === 'Todos' ? 'Todas las Órdenes' : `Órdenes: ${filtroEstado}`}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
                Mostrando {ordenesFiltradas.length} resultados
            </Typography>
        </Box>

        {/* --- BARRA DE HERRAMIENTAS (Buscador + Filtro) --- */}
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
            
            {/* SELECTOR DE ESTADO */}
            <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
                <InputLabel>Estado</InputLabel>
                <Select
                    value={filtroEstado}
                    label="Estado"
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                    <MenuItem value="Todos">Todos</MenuItem>
                    <MenuItem value="Pendiente">Pendientes</MenuItem>
                    <MenuItem value="En Progreso">En Ejecución</MenuItem>
                    <MenuItem value="En Revisión">En Revisión</MenuItem>
                    <MenuItem value="Finalizado">Finalizados</MenuItem>
                </Select>
            </FormControl>

            {/* BUSCADOR DE TEXTO */}
            <TextField
                placeholder="Buscar..."
                variant="outlined"
                size="small"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                sx={{ bgcolor: 'white' }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />
        </Box>
      </Box>

      {/* Grid de Resultados */}
      <Grid container spacing={3}>
        {ordenesFiltradas.length > 0 ? (
            ordenesFiltradas.map((orden) => (
                <Grid item xs={12} md={6} lg={4} key={orden.id}>
                    <Card elevation={3} sx={{ 
                        borderLeft: `6px solid ${orden.estado_data?.color || '#ccc'}`,
                        height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        transition: '0.3s', '&:hover': { transform: 'translateY(-3px)' }
                    }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Chip label={`#${orden.id}`} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
                                <Chip 
                                    label={orden.estado_data?.nombre || 'Sin estado'} 
                                    size="small" 
                                    sx={{ bgcolor: orden.estado_data?.color, color: 'white', fontWeight: 'bold' }} 
                                />
                            </Box>
                            
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.2 }}>
                                {orden.titulo}
                            </Typography>

                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <PersonIcon fontSize="small" color="action" />
                                <Typography variant="body2">{orden.cliente_nombre}</Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <EngineeringIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {orden.tecnico_nombre || "Sin Asignar"}
                                </Typography>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1}>
                                <CalendarMonthIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                    {orden.fecha_inicio ? new Date(orden.fecha_inicio).toLocaleDateString() : 'Sin fecha'}
                                </Typography>
                            </Box>
                        </CardContent>
                        
                        <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button 
                                variant="contained" fullWidth startIcon={<VisibilityIcon />}
                                onClick={() => navigate(`/trabajo/${orden.id}`)}
                                sx={{ bgcolor: '#374151' }} 
                            >
                                Ver Detalle
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            ))
        ) : (
            <Box sx={{ width: '100%', textAlign: 'center', mt: 5, opacity: 0.6 }}>
                <Typography variant="h6">No se encontraron órdenes con estos filtros.</Typography>
                <Button sx={{ mt: 1 }} onClick={() => { setFiltroEstado('Todos'); setBusqueda(''); }}>
                    Limpiar Filtros
                </Button>
            </Box>
        )}
      </Grid>
    </Container>
  );
}