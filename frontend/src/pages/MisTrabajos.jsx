import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Button, Chip, CircularProgress, TextField, InputAdornment, 
  IconButton, Tooltip, Tabs, Tab, Stack, Alert
} from '@mui/material';
import {
  IconSearch,
  IconEye,
  IconRefresh,
  IconCalendar,
  IconMapPin,
  IconClipboardList,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconPlayerPlay
} from '@tabler/icons-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function MisTrabajos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [tabEstado, setTabEstado] = useState('Todos');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const currentUserId = parseInt(localStorage.getItem('user_id'), 10);
  const userRol = localStorage.getItem('user_rol');

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = currentUserId ? `ordenes/?tecnico=${currentUserId}` : 'ordenes/';
      const res = await api.get(url);
      
      const misOrdenes = currentUserId 
        ? res.data.filter(o => o.tecnico === currentUserId || (typeof o.tecnico === 'object' && o.tecnico?.id === currentUserId))
        : res.data;

      setOrdenes(misOrdenes.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error cargando mis trabajos:", error);
      setErrorMsg('No se pudieron cargar las órdenes de trabajo.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const handleIniciarOrdenRapido = async (orden) => {
    setActionLoadingId(orden.id);
    try {
      const resEstados = await api.get('estados/');
      const estadoProgreso = resEstados.data.find(e => e.nombre === 'En Progreso');
      if (!estadoProgreso) return;
      
      const patchData = { estado: estadoProgreso.id };
      if (!orden.tecnico && currentUserId) {
        patchData.tecnico = currentUserId;
      }
      await api.patch(`ordenes/${orden.id}/`, patchData);
      
      const formData = new FormData();
      formData.append('orden', orden.id);
      formData.append('contenido', 'TRABAJO INICIADO POR EL TÉCNICO');
      await api.post('avances/', formData);

      navigate(`/trabajo/${orden.id}`);
    } catch (err) {
      console.error('Error al iniciar orden:', err);
      alert('Ocurrió un error al iniciar el trabajo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    if (userRol === 'Cliente') {
      navigate('/mis-solicitudes');
      return;
    }
    fetchDatos();
  }, [fetchDatos, navigate, userRol]);

  // Conteos por estado
  const conteos = useMemo(() => {
    const counts = {
      Todos: ordenes.length,
      Activos: 0,
      'En Revisión': 0,
      Finalizado: 0
    };
    ordenes.forEach(o => {
      const estado = o.estado_data?.nombre;
      if (['Pendiente', 'En Progreso'].includes(estado)) {
        counts.Activos++;
      } else if (estado === 'En Revisión') {
        counts['En Revisión']++;
      } else if (estado === 'Finalizado') {
        counts.Finalizado++;
      }
    });
    return counts;
  }, [ordenes]);

  // Filtrado de órdenes
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(orden => {
      const q = busqueda.toLowerCase().trim();
      const titulo = (orden.titulo || '').toLowerCase();
      const cliente = (orden.cliente_nombre || '').toLowerCase();
      const direccion = (orden.direccion || '').toLowerCase();
      const idStr = String(orden.id);

      const coincideTexto = !q || (
        titulo.includes(q) ||
        cliente.includes(q) ||
        direccion.includes(q) ||
        idStr.includes(q)
      );

      let coincideEstado = true;
      if (tabEstado === 'Activos') {
        coincideEstado = ['Pendiente', 'En Progreso'].includes(orden.estado_data?.nombre);
      } else if (tabEstado === 'En Revisión') {
        coincideEstado = orden.estado_data?.nombre === 'En Revisión';
      } else if (tabEstado === 'Finalizado') {
        coincideEstado = orden.estado_data?.nombre === 'Finalizado';
      }

      return coincideTexto && coincideEstado;
    });
  }, [ordenes, busqueda, tabEstado]);

  // Manejo de paginación
  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const ordenesPaginadas = useMemo(() => {
    return ordenesFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [ordenesFiltradas, page, rowsPerPage]);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return { fecha: 'Sin programar', hora: '' };
    const date = new Date(fechaStr);
    const fecha = date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    const hora = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    return { fecha, hora };
  };

  return (
    <Container maxWidth={false} sx={{ mt: 3, mb: 6, px: { xs: 2, md: 4 } }}>
      
      {/* CABECERA PRINCIPAL */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
            Mis Trabajos Asignados
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Consulta y gestiona las órdenes de trabajo asignadas a tu cargo
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Actualizar lista">
            <IconButton 
              onClick={fetchDatos} 
              sx={{ bgcolor: '#ffffff', border: '1px solid #e2e8f0', p: 1.2, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' } }}
            >
              <IconRefresh size={20} color="#0288d1" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* CONTENEDOR DE TABLA */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: '#ffffff' }}>
        
        {/* PESTAÑAS DE ESTADO */}
        <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', bgcolor: '#f8fafc', px: 2, pt: 1 }}>
          <Tabs 
            value={tabEstado} 
            onChange={(_, v) => { setTabEstado(v); setPage(0); }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                minHeight: 48,
                px: 2,
              }
            }}
          >
            <Tab 
              value="Todos" 
              label={`Todos (${conteos.Todos})`} 
            />
            <Tab 
              value="Activos" 
              icon={<IconClock size={17} color="#e65100" />}
              iconPosition="start"
              label={`Activos y En Progreso (${conteos.Activos})`} 
            />
            <Tab 
              value="En Revisión" 
              icon={<IconAlertCircle size={17} color="#7b1fa2" />}
              iconPosition="start"
              label={`En Revisión (${conteos['En Revisión']})`} 
            />
            <Tab 
              value="Finalizado" 
              icon={<IconCheck size={17} color="#16a34a" />}
              iconPosition="start"
              label={`Finalizados (${conteos.Finalizado})`} 
            />
          </Tabs>
        </Box>

        {/* BUSCADOR */}
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: '#ffffff' }}>
          <TextField
            placeholder="Buscar por #ID, título, cliente o dirección..."
            variant="outlined"
            size="small"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
            sx={{ 
              width: { xs: '100%', sm: 380 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f8fafc',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={18} color="#64748b" />
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="body2" color="text.secondary" fontWeight="600">
            Mostrando <strong>{ordenesFiltradas.length}</strong> {ordenesFiltradas.length === 1 ? 'orden' : 'órdenes'}
          </Typography>
        </Box>

        {/* TABLA DE ÓRDENES */}
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc', '& th': { color: '#475569', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 } }}>
                <TableCell align="center" sx={{ width: 90 }}># Orden</TableCell>
                <TableCell align="left">Trabajo / Ubicación</TableCell>
                <TableCell align="left">Cliente</TableCell>
                <TableCell align="center">Fecha Programada</TableCell>
                <TableCell align="center" sx={{ width: 140 }}>Estado</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Cargando órdenes asignadas...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : ordenesPaginadas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <IconClipboardList size={52} stroke={1.3} color="#94a3b8" style={{ marginBottom: 10 }} />
                    <Typography variant="h6" color="#334155" fontWeight="700">
                      No se encontraron trabajos
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {busqueda ? 'No hay órdenes que coincidan con la búsqueda.' : 'No tienes órdenes asignadas en esta categoría.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                ordenesPaginadas.map((orden) => {
                  const { fecha, hora } = formatearFecha(orden.fecha_inicio);
                  const colorEstado = orden.estado_data?.color || '#64748b';

                  return (
                    <TableRow
                      key={orden.id}
                      hover
                      onClick={() => navigate(`/trabajo/${orden.id}`)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        '&:hover': { bgcolor: '#f1f5f9' },
                        '& td': { py: 2 }
                      }}
                    >
                      {/* # ORDEN */}
                      <TableCell align="center">
                        <Chip
                          label={`#${orden.id}`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: '#f1f5f9',
                            color: '#1e293b',
                            borderRadius: 1.5,
                            fontFamily: 'monospace',
                            fontSize: '0.82rem'
                          }}
                        />
                      </TableCell>

                      {/* TÍTULO Y DIRECCIÓN */}
                      <TableCell align="left">
                        <Typography variant="subtitle2" fontWeight="800" color="#0f172a" sx={{ lineHeight: 1.3 }}>
                          {orden.titulo}
                        </Typography>
                        {orden.direccion ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                            <IconMapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 280 }}>
                              {orden.direccion}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', display: 'block', mt: 0.4 }}>
                            Sin dirección especificada
                          </Typography>
                        )}
                      </TableCell>

                      {/* CLIENTE */}
                      <TableCell align="left">
                        <Typography variant="body2" fontWeight="700" color="#1e293b">
                          {orden.cliente_nombre || 'Sin cliente asignado'}
                        </Typography>
                      </TableCell>

                      {/* FECHA */}
                      <TableCell align="center">
                        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconCalendar size={14} color="#64748b" />
                            <Typography variant="body2" fontWeight="700" color="#334155">
                              {fecha}
                            </Typography>
                          </Box>
                          {hora && (
                            <Typography variant="caption" color="text.secondary">
                              {hora}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* ESTADO */}
                      <TableCell align="center">
                        <Chip
                          label={orden.estado_data?.nombre || 'Desconocido'}
                          size="small"
                          sx={{
                            bgcolor: `${colorEstado}18`,
                            color: colorEstado,
                            fontWeight: 800,
                            border: `1px solid ${colorEstado}40`,
                            fontSize: '0.75rem',
                            height: 24,
                            px: 0.5
                          }}
                        />
                      </TableCell>

                      {/* ACCIONES */}
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          {orden.estado_data?.nombre === 'Pendiente' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={actionLoadingId === orden.id}
                              startIcon={actionLoadingId === orden.id ? <CircularProgress size={14} color="inherit" /> : <IconPlayerPlay size={15} />}
                              onClick={() => handleIniciarOrdenRapido(orden)}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                borderRadius: 2,
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                                textTransform: 'none'
                              }}
                            >
                              Iniciar
                            </Button>
                          )}

                          <Tooltip title="Ver Bitácora y Detalle">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/trabajo/${orden.id}`)}
                              sx={{
                                color: '#0288d1',
                                bgcolor: '#f0f9ff',
                                '&:hover': { bgcolor: '#e0f2fe' }
                              }}
                            >
                              <IconEye size={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINACIÓN */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={ordenesFiltradas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
          sx={{
            borderTop: '1px solid #e2e8f0',
            color: '#64748b',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontWeight: 600,
              fontSize: '0.82rem'
            }
          }}
        />
      </Paper>
    </Container>
  );
}