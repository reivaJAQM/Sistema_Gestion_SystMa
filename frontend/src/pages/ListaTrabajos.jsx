import React, { useEffect, useState, useCallback } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, CardActions, 
  Button, Grid, Chip, CircularProgress, TextField, InputAdornment, 
  MenuItem, FormControl, Select, InputLabel, Paper, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EngineeringIcon from '@mui/icons-material/Engineering';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteIcon from '@mui/icons-material/Delete';

import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ListaTrabajos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const location = useLocation(); 
  const [filtroEstado, setFiltroEstado] = useState(location.state?.filtro || 'Todos');

  // Modal Eliminación
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);

  const navigate = useNavigate();
  const userRol = localStorage.getItem('user_rol');

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('ordenes/');
      setOrdenes(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error cargando lista", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRol === 'Cliente') {
      navigate('/mis-solicitudes');
      return;
    }
    if (userRol === 'Tecnico') {
      navigate('/calendario');
      return;
    }
    fetchDatos();
  }, [fetchDatos, navigate, userRol]);

  const handleConfirmarEliminar = async () => {
    if (!ordenAEliminar) return;
    setActionLoading(true);
    try {
      await api.delete(`ordenes/${ordenAEliminar.id}/`);
      setOpenDeleteModal(false);
      setOrdenAEliminar(null);
      fetchDatos();
    } catch (error) {
      console.error("Error al eliminar orden", error);
      alert("Error al eliminar la orden de trabajo.");
    } finally {
      setActionLoading(false);
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
      
      {/* Encabezado */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
            Órdenes de Trabajo
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mt: 0.5 }}>
            Consulta, filtra y gestiona todas las órdenes de trabajo del sistema
          </Typography>
        </Box>
        <Tooltip title="Recargar datos">
          <IconButton onClick={fetchDatos} sx={{ bgcolor: '#ffffff', border: '1px solid #e2e8f0', p: 1.2, borderRadius: '12px' }}>
            <RefreshIcon sx={{ color: '#2563eb' }} />
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
                        
                        <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
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
                            {userRol === 'Administrador' && (
                              <Tooltip title="Eliminar Orden">
                                <IconButton 
                                  color="error" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOrdenAEliminar(orden);
                                    setOpenDeleteModal(true);
                                  }}
                                  sx={{ 
                                    border: '1px solid', 
                                    borderColor: 'error.light', 
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'error.lighter' }
                                  }}
                                >
                                  <DeleteOutlineIcon />
                                </IconButton>
                              </Tooltip>
                            )}
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

      {/* MODAL ELIMINAR ORDEN (SOLO ADMIN) */}
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 'bold' }}>
          <DeleteIcon /> ¿Eliminar Orden de Trabajo?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.primary" gutterBottom>
            Esta acción eliminará de forma permanente la orden <strong>"{ordenAEliminar?.titulo}"</strong> (#{ordenAEliminar?.id}), junto con todas sus fotos y avances.
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            Esta operación no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteModal(false)} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleConfirmarEliminar} 
            variant="contained" 
            color="error" 
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Sí, Eliminar Definitivamente"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}