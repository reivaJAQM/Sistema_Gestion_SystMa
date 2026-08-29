import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Button, Chip, CircularProgress, TextField, InputAdornment, 
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Alert, Tabs, Tab, Avatar, Stack
} from '@mui/material';
import {
  IconSearch,
  IconEye,
  IconTrash,
  IconRefresh,
  IconPlus,
  IconCalendar,
  IconMapPin,
  IconPhone,
  IconId,
  IconTool,
  IconUser,
  IconAlertTriangle,
  IconClipboardList,
  IconFilter
} from '@tabler/icons-react';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ListaTrabajos() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const location = useLocation(); 
  const [tabEstado, setTabEstado] = useState(location.state?.filtro || 'Todos');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal Eliminación
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);

  const navigate = useNavigate();
  const userRol = localStorage.getItem('user_rol');
  const esAdmin = userRol === 'Administrador';

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('ordenes/');
      setOrdenes(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error cargando lista de órdenes", error);
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
      console.error("Error al eliminar la orden", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Conteos por estado
  const conteos = useMemo(() => {
    const counts = {
      Todos: ordenes.length,
      Pendiente: 0,
      'En Progreso': 0,
      'En Revisión': 0,
      Finalizado: 0,
      Cancelado: 0
    };
    ordenes.forEach(o => {
      const estado = o.estado_data?.nombre;
      if (counts[estado] !== undefined) {
        counts[estado]++;
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
      const cedula = (orden.cliente_cedula || '').toLowerCase();
      const direccion = (orden.direccion || '').toLowerCase();
      const tecnico = (orden.tecnico_nombre || '').toLowerCase();
      const idStr = String(orden.id);

      const coincideTexto = !q || (
        titulo.includes(q) ||
        cliente.includes(q) ||
        cedula.includes(q) ||
        direccion.includes(q) ||
        tecnico.includes(q) ||
        idStr.includes(q)
      );

      const coincideEstado = tabEstado === 'Todos' || orden.estado_data?.nombre === tabEstado;

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
            Órdenes de Trabajo
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Directorio operativo, seguimiento de estados y control de servicios
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Actualizar listado">
            <IconButton 
              onClick={fetchDatos} 
              sx={{ bgcolor: '#ffffff', border: '1px solid #e2e8f0', p: 1.2, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' } }}
            >
              <IconRefresh size={20} color="#0288d1" />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<IconPlus size={20} />}
            onClick={() => navigate('/nueva-orden')}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 2.5,
              py: 1.2,
              bgcolor: '#0288d1',
              '&:hover': { bgcolor: '#01579b' },
              boxShadow: '0 4px 12px rgba(2, 136, 209, 0.25)'
            }}
          >
            Nueva Orden
          </Button>
        </Stack>
      </Box>

      {/* CONTENEDOR PRINCIPAL */}
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
              value="Pendiente" 
              label={`Pendientes (${conteos.Pendiente})`} 
            />
            <Tab 
              value="En Progreso" 
              label={`En Progreso (${conteos['En Progreso']})`} 
            />
            <Tab 
              value="En Revisión" 
              label={`En Revisión (${conteos['En Revisión']})`} 
            />
            <Tab 
              value="Finalizado" 
              label={`Finalizados (${conteos.Finalizado})`} 
            />
            {conteos.Cancelado > 0 && (
              <Tab 
                value="Cancelado" 
                label={`Cancelados (${conteos.Cancelado})`} 
              />
            )}
          </Tabs>
        </Box>

        {/* BARRA DE HERRAMIENTAS Y BÚSQUEDA */}
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: '#ffffff' }}>
          <TextField
            placeholder="Buscar por #ID, título, cliente, cédula, dirección o técnico..."
            variant="outlined"
            size="small"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
            sx={{ 
              width: { xs: '100%', sm: 420 },
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
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc', '& th': { color: '#475569', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.8 } }}>
                <TableCell align="center" sx={{ width: 90 }}># Orden</TableCell>
                <TableCell align="left">Trabajo / Ubicación</TableCell>
                <TableCell align="left">Cliente</TableCell>
                <TableCell align="left">Técnico Asignado</TableCell>
                <TableCell align="center">Fecha Programada</TableCell>
                <TableCell align="center" sx={{ width: 140 }}>Estado</TableCell>
                <TableCell align="center" sx={{ width: 140 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Cargando órdenes de trabajo...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : ordenesPaginadas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <IconClipboardList size={52} stroke={1.3} color="#94a3b8" style={{ marginBottom: 10 }} />
                    <Typography variant="h6" color="#334155" fontWeight="700">
                      No se encontraron órdenes de trabajo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {busqueda ? 'Intenta ajustando el término de búsqueda o cambiando de pestaña.' : 'Aún no se han registrado órdenes en esta sección.'}
                    </Typography>
                    {busqueda && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => { setBusqueda(''); setTabEstado('Todos'); }}
                        sx={{ mt: 2, borderRadius: 2 }}
                      >
                        Restablecer filtros
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                ordenesPaginadas.map((orden) => {
                  const { fecha, hora } = formatearFecha(orden.fecha_inicio);
                  const colorEstado = orden.estado_data?.color || '#64748b';
                  const inicialesTecnico = orden.tecnico_nombre
                    ? orden.tecnico_nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : '?';

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
                      {/* ID */}
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

                      {/* TÍTULO Y UBICACIÓN */}
                      <TableCell align="left">
                        <Typography variant="subtitle2" fontWeight="800" color="#0f172a" sx={{ lineHeight: 1.3 }}>
                          {orden.titulo}
                        </Typography>
                        {orden.direccion ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                            <IconMapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260 }}>
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
                          {orden.cliente_nombre}
                        </Typography>
                      </TableCell>

                      {/* TÉCNICO */}
                      <TableCell align="left">
                        {orden.tecnico_nombre ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#e65100', fontWeight: 700 }}>
                              {inicialesTecnico}
                            </Avatar>
                            <Typography variant="body2" fontWeight="600" color="#334155">
                              {orden.tecnico_nombre}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip 
                            label="Sin Asignar" 
                            size="small" 
                            variant="outlined" 
                            sx={{ color: '#94a3b8', borderColor: '#cbd5e1', fontStyle: 'italic', fontSize: '0.72rem' }} 
                          />
                        )}
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
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Ver Detalle de la Orden">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/trabajo/${orden.id}`)}
                              sx={{
                                color: '#0288d1',
                                bgcolor: '#f0f9ff',
                                '&:hover': { bgcolor: '#e0f2fe' }
                              }}
                            >
                              <IconEye size={17} />
                            </IconButton>
                          </Tooltip>

                          {esAdmin && (
                            <Tooltip title="Eliminar Orden">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setOrdenAEliminar(orden);
                                  setOpenDeleteModal(true);
                                }}
                                sx={{
                                  color: '#ef4444',
                                  bgcolor: '#fef2f2',
                                  '&:hover': { bgcolor: '#fee2e2' }
                                }}
                              >
                                <IconTrash size={17} />
                              </IconButton>
                            </Tooltip>
                          )}
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

      {/* MODAL ELIMINAR ORDEN (SOLO ADMIN) */}
      <Dialog 
        open={openDeleteModal} 
        onClose={() => setOpenDeleteModal(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444', fontWeight: '800' }}>
          <IconTrash size={22} /> Eliminar Orden de Trabajo
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar permanentemente la orden <strong>"{ordenAEliminar?.titulo}"</strong> (#{ordenAEliminar?.id})?
          </Typography>
          <Alert severity="error" icon={<IconAlertTriangle size={20} />} sx={{ borderRadius: 2 }}>
            Esta acción no se puede deshacer. Se eliminarán permanentemente todas las bitácoras, evidencias fotográficas y registros asociados.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenDeleteModal(false)} color="inherit" sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmarEliminar} 
            variant="contained" 
            color="error" 
            disabled={actionLoading}
            startIcon={!actionLoading && <IconTrash size={18} />}
            sx={{ borderRadius: 2 }}
          >
            {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Sí, Eliminar Definitivamente"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}