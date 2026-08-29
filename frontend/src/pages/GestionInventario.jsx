import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Paper, Typography, Box, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Chip, Tabs, Tab, CircularProgress, Alert,
    MenuItem, InputAdornment, Tooltip, Stack, Card, CardContent, Grid
} from '@mui/material';
import {
    IconPlus, IconPencil, IconTrash, IconTools, IconTool,
    IconPackages, IconPackage, IconAlertTriangle, IconCircleCheck,
    IconInbox, IconSearch, IconHistory, IconFilter
} from '@tabler/icons-react';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HandymanIcon from '@mui/icons-material/Handyman';
import HistoryIcon from '@mui/icons-material/History';

import api from '../services/api';

export default function GestionInventario() {
    const [tabActual, setTabActual] = useState(0);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [herramientasEnUso, setHerramientasEnUso] = useState([]);

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('TODOS');
    const [filtroStockBajo, setFiltroStockBajo] = useState(false);

    // Modales
    const [openModalItem, setOpenModalItem] = useState(false);
    const [openModalEntrada, setOpenModalEntrada] = useState(false);
    const [openModalDelete, setOpenModalDelete] = useState(false);

    // Estado Item Actual (Crear/Editar)
    const [itemEditando, setItemEditando] = useState(null);
    const [formItem, setFormItem] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo: 'MATERIAL',
        unidad_medida: 'Unidad',
        stock_actual: 0,
        stock_minimo: 5,
        estado_herramienta: 'DISPONIBLE'
    });

    // Estado Entrada de Stock
    const [itemSeleccionado, setItemSeleccionado] = useState(null);
    const [cantidadEntrada, setCantidadEntrada] = useState('');
    const [motivoEntrada, setMotivoEntrada] = useState('Compra / Reposición de almacén');
    const [saving, setSaving] = useState(false);
    const [mensajeFeedback, setMensajeFeedback] = useState(null);

    const userRol = localStorage.getItem('user_rol');

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            const [resItems, resMovs, resHerramientas] = await Promise.all([
                api.get('inventario/'),
                api.get('movimientos-inventario/'),
                api.get('orden-herramientas/')
            ]);
            setItems(resItems.data);
            setMovimientos(resMovs.data);
            setHerramientasEnUso(resHerramientas.data.filter(h => !h.devuelta));
        } catch (error) {
            console.error('Error cargando inventario:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Filtrar Items
    const itemsFiltrados = items.filter(item => {
        const coincideBusqueda =
            item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            item.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
            (item.descripcion && item.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

        const coincideTipo =
            filtroTipo === 'TODOS' ? true : item.tipo === filtroTipo;

        const coincideStockBajo =
            filtroStockBajo ? item.stock_bajo : true;

        return coincideBusqueda && coincideTipo && coincideStockBajo;
    });

    // Métricas KPI
    const totalItems = items.length;
    const totalMateriales = items.filter(i => i.tipo === 'MATERIAL').length;
    const totalHerramientas = items.filter(i => i.tipo === 'HERRAMIENTA').length;
    const totalStockBajo = items.filter(i => i.stock_bajo).length;
    const totalHerramientasPrestadas = herramientasEnUso.length;

    // Manejadores de Modales
    const handleAbrirCrear = () => {
        setItemEditando(null);
        setFormItem({
            codigo: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
            nombre: '',
            descripcion: '',
            tipo: 'MATERIAL',
            unidad_medida: 'Unidad',
            stock_actual: 0,
            stock_minimo: 5,
            estado_herramienta: 'DISPONIBLE'
        });
        setOpenModalItem(true);
    };

    const handleCambioTipo = (nuevoTipo) => {
        const numRandom = Math.floor(1000 + Math.random() * 9000);
        if (nuevoTipo === 'HERRAMIENTA') {
            setFormItem({
                ...formItem,
                tipo: 'HERRAMIENTA',
                codigo: formItem.codigo.startsWith('MAT-') || formItem.codigo.startsWith('ITM-') ? `HER-${numRandom}` : formItem.codigo,
                unidad_medida: 'Unidad',
                stock_actual: 1,
                stock_minimo: 0,
                estado_herramienta: 'DISPONIBLE'
            });
        } else {
            setFormItem({
                ...formItem,
                tipo: 'MATERIAL',
                codigo: formItem.codigo.startsWith('HER-') || formItem.codigo.startsWith('ITM-') ? `MAT-${numRandom}` : formItem.codigo,
                unidad_medida: 'Unidad',
                stock_actual: 0,
                stock_minimo: 5
            });
        }
    };

    const handleAbrirEditar = (item) => {
        setItemEditando(item);
        const numStock = Number(item.stock_actual) || 0;
        const numMinimo = Number(item.stock_minimo) || 0;
        setFormItem({
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion || '',
            tipo: item.tipo,
            unidad_medida: item.unidad_medida,
            stock_actual: item.tipo === 'HERRAMIENTA' ? Math.round(numStock) : (Number.isInteger(numStock) ? numStock : parseFloat(numStock.toFixed(2))),
            stock_minimo: Number.isInteger(numMinimo) ? numMinimo : parseFloat(numMinimo.toFixed(2)),
            estado_herramienta: item.estado_herramienta
        });
        setOpenModalItem(true);
    };

    const handleGuardarItem = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (itemEditando) {
                await api.put(`inventario/${itemEditando.id}/`, formItem);
                setMensajeFeedback({ tipo: 'success', texto: 'Ítem actualizado exitosamente.' });
            } else {
                await api.post('inventario/', formItem);
                setMensajeFeedback({ tipo: 'success', texto: 'Ítem registrado exitosamente.' });
            }
            setOpenModalItem(false);
            cargarDatos();
        } catch (error) {
            console.error('Error al guardar ítem:', error);
            const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Error al guardar el ítem.';
            setMensajeFeedback({ tipo: 'error', texto: msg });
        } finally {
            setSaving(false);
        }
    };

    const handleAbrirEntrada = (item) => {
        setItemSeleccionado(item);
        setCantidadEntrada('');
        setMotivoEntrada('Compra / Reposición de almacén');
        setOpenModalEntrada(true);
    };

    const handleGuardarEntrada = async (e) => {
        e.preventDefault();
        if (!cantidadEntrada || Number(cantidadEntrada) <= 0) {
            alert('Ingresa una cantidad válida mayor a cero.');
            return;
        }
        setSaving(true);
        try {
            await api.post(`inventario/${itemSeleccionado.id}/registrar-entrada/`, {
                cantidad: cantidadEntrada,
                motivo: motivoEntrada
            });
            setMensajeFeedback({ tipo: 'success', texto: `Se añadieron ${cantidadEntrada} ${itemSeleccionado.unidad_medida} al stock.` });
            setOpenModalEntrada(false);
            cargarDatos();
        } catch (error) {
            console.error('Error registrando entrada:', error);
            alert('Error al registrar la entrada de stock.');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmarEliminar = async () => {
        if (!itemSeleccionado) return;
        setSaving(true);
        try {
            await api.delete(`inventario/${itemSeleccionado.id}/`);
            setMensajeFeedback({ tipo: 'info', texto: 'Ítem eliminado del inventario.' });
            setOpenModalDelete(false);
            cargarDatos();
        } catch (error) {
            console.error('Error eliminando ítem:', error);
            alert('No se puede eliminar un ítem que tiene historial o asignaciones en órdenes.');
        } finally {
            setSaving(false);
        }
    };

    const formatearStockTexto = (valor, unidad) => {
        const num = Math.round(Number(valor) || 0);
        const numAbs = Math.abs(num);
        let unidadTexto = unidad ? unidad.trim() : 'Unidad';
        if (!unidadTexto || unidadTexto.toLowerCase() === 'unidad' || unidadTexto.toLowerCase() === 'unidades') {
            unidadTexto = numAbs >= 2 ? 'Unidades' : 'Unidad';
        }
        return { num, unidad: unidadTexto };
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 6, pt: 3 }}>
            <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>

                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="900" sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
                            Control de Materiales e Inventario
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#64748b', mt: 0.5 }}>
                            Gestión de herramientas retornables, catálogo de materiales y movimientos
                        </Typography>
                    </Box>

                    {(userRol === 'Administrador' || userRol === 'Supervisor') && (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<IconPlus size={20} stroke={2} />}
                            onClick={handleAbrirCrear}
                            sx={{
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                px: 3,
                                py: 1.2,
                                background: '#2563eb',
                                '&:hover': { background: '#1d4ed8' }
                            }}
                        >
                            Nuevo Ítem
                        </Button>
                    )}
                </Box>

                {mensajeFeedback && (
                    <Alert
                        severity={mensajeFeedback.tipo}
                        onClose={() => setMensajeFeedback(null)}
                        sx={{ mb: 3, borderRadius: '12px' }}
                    >
                        {mensajeFeedback.texto}
                    </Alert>
                )}

                {/* --- TARJETAS KPI --- */}
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                                <Box sx={{ p: 1.5, bgcolor: '#eff6ff', color: '#2563eb', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconPackages size={28} stroke={1.75} />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="800" color="#1e293b">{totalItems}</Typography>
                                    <Typography variant="caption" fontWeight="600" color="#64748b">Total Ítems en Inventario</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                                <Box sx={{ p: 1.5, bgcolor: '#ecfdf5', color: '#10b981', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconTools size={28} stroke={1.75} />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="800" color="#1e293b">{totalHerramientas}</Typography>
                                    <Typography variant="caption" fontWeight="600" color="#64748b">Herramientas / Equipos</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                                <Box sx={{ p: 1.5, bgcolor: '#fffbeb', color: '#f59e0b', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconTool size={28} stroke={1.75} />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="800" color="#1e293b">{totalHerramientasPrestadas}</Typography>
                                    <Typography variant="caption" fontWeight="600" color="#64748b">Herramientas En Uso</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                            border: totalStockBajo > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                            bgcolor: totalStockBajo > 0 ? '#fff1f2' : '#ffffff'
                        }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                                <Box sx={{ p: 1.5, bgcolor: totalStockBajo > 0 ? '#fee2e2' : '#f1f5f9', color: totalStockBajo > 0 ? '#ef4444' : '#64748b', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconAlertTriangle size={28} stroke={1.75} />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight="800" color={totalStockBajo > 0 ? '#b91c1c' : '#1e293b'}>{totalStockBajo}</Typography>
                                    <Typography variant="caption" fontWeight="600" color={totalStockBajo > 0 ? '#b91c1c' : '#64748b'}>Alertas de Stock Bajo</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* --- PESTAÑAS DE NAVEGACIÓN --- */}
                <Paper elevation={0} sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', px: 3, pt: 2, bgcolor: '#ffffff' }}>
                        <Tabs
                            value={tabActual}
                            onChange={(e, val) => setTabActual(val)}
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    minHeight: '48px'
                                }
                            }}
                        >
                            <Tab icon={<Inventory2Icon fontSize="small" />} iconPosition="start" label={`Catálogo e Inventario (${itemsFiltrados.length})`} />
                            <Tab icon={<HandymanIcon fontSize="small" />} iconPosition="start" label={`Herramientas en Campo (${herramientasEnUso.length})`} />
                            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Historial de Movimientos" />
                        </Tabs>
                    </Box>

                    {/* ==================================================================== */}
                    {/* TAB 0: CATÁLOGO E INVENTARIO */}
                    {/* ==================================================================== */}
                    {tabActual === 0 && (
                        <Box sx={{ p: 3 }}>
                            {/* Barra de Filtros */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
                                    <TextField
                                        size="small"
                                        placeholder="Buscar por código, nombre o descripción..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        sx={{ minWidth: 280, bgcolor: '#ffffff' }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <IconSearch size={18} stroke={1.75} color="#94a3b8" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <TextField
                                        select
                                        size="small"
                                        value={filtroTipo}
                                        onChange={(e) => setFiltroTipo(e.target.value)}
                                        sx={{ minWidth: 160, bgcolor: '#ffffff' }}
                                    >
                                        <MenuItem value="TODOS">Todos los Tipos</MenuItem>
                                        <MenuItem value="MATERIAL">Materiales</MenuItem>
                                        <MenuItem value="HERRAMIENTA">Herramientas</MenuItem>
                                    </TextField>

                                    {filtroTipo !== 'HERRAMIENTA' && (
                                        <Button
                                            variant={filtroStockBajo ? "contained" : "outlined"}
                                            color={filtroStockBajo ? "error" : "inherit"}
                                            size="small"
                                            startIcon={<IconAlertTriangle size={18} stroke={1.75} />}
                                            onClick={() => setFiltroStockBajo(!filtroStockBajo)}
                                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                                        >
                                            {filtroStockBajo ? "Viendo solo stock bajo" : "Filtrar stock bajo"}
                                        </Button>
                                    )}
                                </Box>
                            </Box>

                            {/* Tabla de Ítems */}
                            {loading ? (
                                <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
                            ) : itemsFiltrados.length === 0 ? (
                                <Box sx={{ p: 6, textAlign: 'center' }}>
                                    <IconPackages size={56} stroke={1.5} color="#cbd5e1" style={{ marginBottom: 8 }} />
                                    <Typography variant="h6" color="#64748b">No se encontraron ítems en el catálogo</Typography>
                                    <Typography variant="body2" color="#94a3b8">Intenta ajustar los filtros o registra un nuevo ítem.</Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Código</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Nombre / Descripción</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Tipo</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>
                                                    {filtroTipo === 'HERRAMIENTA' ? 'Cantidad Disponible' : 'Stock Actual'}
                                                </TableCell>
                                                {filtroTipo !== 'HERRAMIENTA' && (
                                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Stock Mínimo</TableCell>
                                                )}
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Estado</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {itemsFiltrados.map((item) => (
                                                <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#334155' }}>
                                                        {item.codigo}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold" color="#1e293b">
                                                            {item.nombre}
                                                        </Typography>
                                                        {item.descripcion && (
                                                            <Typography variant="caption" color="#64748b">
                                                                {item.descripcion}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            size="small"
                                                            icon={item.tipo === 'HERRAMIENTA' ? <IconTools size={14} stroke={2} /> : <IconPackage size={14} stroke={2} />}
                                                            label={item.tipo_display}
                                                            sx={{
                                                                bgcolor: item.tipo === 'HERRAMIENTA' ? '#eff6ff' : '#f0fdf4',
                                                                color: item.tipo === 'HERRAMIENTA' ? '#1d4ed8' : '#15803d',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {(() => {
                                                            const info = formatearStockTexto(item.stock_actual, item.unidad_medida);
                                                            return (
                                                                <Typography variant="body2" fontWeight="bold" color={item.stock_bajo && item.tipo === 'MATERIAL' ? '#dc2626' : '#1e293b'}>
                                                                    {info.num} {info.unidad && <Typography component="span" variant="caption" color="text.secondary">{info.unidad}</Typography>}
                                                                </Typography>
                                                            );
                                                        })()}
                                                    </TableCell>
                                                    {filtroTipo !== 'HERRAMIENTA' && (
                                                        <TableCell align="center">
                                                            {item.tipo === 'MATERIAL' ? (() => {
                                                                const infoMin = formatearStockTexto(item.stock_minimo, item.unidad_medida);
                                                                return (
                                                                    <Typography variant="body2" color="#64748b">
                                                                        {infoMin.num} {infoMin.unidad}
                                                                    </Typography>
                                                                );
                                                            })() : (
                                                                <Typography variant="body2" color="#94a3b8">—</Typography>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                    <TableCell align="center">
                                                        {item.tipo === 'HERRAMIENTA' ? (
                                                            <Chip
                                                                size="small"
                                                                label={item.estado_herramienta_display}
                                                                sx={{
                                                                    bgcolor: item.estado_herramienta === 'DISPONIBLE' ? '#dcfce7' : item.estado_herramienta === 'EN_USO' ? '#fef3c7' : '#fee2e2',
                                                                    color: item.estado_herramienta === 'DISPONIBLE' ? '#166534' : item.estado_herramienta === 'EN_USO' ? '#b45309' : '#991b1b',
                                                                    fontWeight: 700
                                                                }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                size="small"
                                                                label={item.stock_bajo ? "Stock Crítico" : "Normal"}
                                                                sx={{
                                                                    bgcolor: item.stock_bajo ? '#fee2e2' : '#f1f5f9',
                                                                    color: item.stock_bajo ? '#b91c1c' : '#475569',
                                                                    fontWeight: 700
                                                                }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Stack direction="row" spacing={1} justifyContent="center">
                                                            <Tooltip title="Editar">
                                                                <IconButton size="small" onClick={() => handleAbrirEditar(item)} sx={{ color: '#64748b' }}>
                                                                    <IconPencil size={18} stroke={1.75} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Eliminar">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => { setItemSeleccionado(item); setOpenModalDelete(true); }}
                                                                    sx={{ color: '#ef4444' }}
                                                                >
                                                                    <IconTrash size={18} stroke={1.75} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}

                    {/* ==================================================================== */}
                    {/* TAB 1: HERRAMIENTAS EN CAMPO / ASIGNADAS */}
                    {/* ==================================================================== */}
                    {tabActual === 1 && (
                        <Box sx={{ p: 3 }}>
                            {herramientasEnUso.length === 0 ? (
                                <Box sx={{ p: 6, textAlign: 'center' }}>
                                    <IconCircleCheck size={56} stroke={1.5} color="#10b981" style={{ marginBottom: 8 }} />
                                    <Typography variant="h6" color="#1e293b" fontWeight="bold">Todas las herramientas están en almacén</Typography>
                                    <Typography variant="body2" color="#64748b">No hay equipos prestados o en uso activo en este momento.</Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Herramienta</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Código</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Orden de Trabajo</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Fecha Asignación</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Estado</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {herramientasEnUso.map((asig) => (
                                                <TableRow key={asig.id} hover>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                                                        {asig.herramienta_nombre}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: '#64748b' }}>{asig.herramienta_codigo}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            size="small"
                                                            label={`Orden #${asig.orden}`}
                                                            sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: '#64748b' }}>
                                                        {new Date(asig.fecha_asignacion).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip size="small" label="En Uso" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 'bold' }} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}

                    {/* ==================================================================== */}
                    {/* TAB 2: HISTORIAL DE MOVIMIENTOS */}
                    {/* ==================================================================== */}
                    {tabActual === 2 && (
                        <Box sx={{ p: 3 }}>
                            {movimientos.length === 0 ? (
                                <Box sx={{ p: 6, textAlign: 'center' }}>
                                    <IconHistory size={56} stroke={1.5} color="#cbd5e1" style={{ marginBottom: 8 }} />
                                    <Typography variant="h6" color="#64748b">No hay movimientos registrados en el historial</Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Fecha y Hora</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Ítem</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Tipo de Movimiento</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Cantidad</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Stock Resultante</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>Técnico</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Motivo / Orden</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {movimientos.map((m) => {
                                                const esEntrada = m.tipo_movimiento === 'ENTRADA' || m.tipo_movimiento === 'DEVOLUCION';
                                                const cantEntera = Math.round(Number(m.cantidad) || 0);
                                                const cantAbs = Math.abs(cantEntera);
                                                const unidadCant = cantAbs >= 2 ? 'Unidades' : 'Unidad';

                                                const stockNuevoEntero = Math.round(Number(m.stock_nuevo) || 0);
                                                const stockAbs = Math.abs(stockNuevoEntero);
                                                const unidadStock = stockAbs >= 2 ? 'Unidades' : 'Unidad';

                                                return (
                                                    <TableRow key={m.id} hover>
                                                        <TableCell align="center" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                            {new Date(m.fecha).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                                                            {m.item_nombre}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                size="small"
                                                                label={m.tipo_movimiento_display}
                                                                sx={{
                                                                    bgcolor: esEntrada ? '#dcfce7' : '#fee2e2',
                                                                    color: esEntrada ? '#15803d' : '#b91c1c',
                                                                    fontWeight: 700
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', color: esEntrada ? '#16a34a' : '#dc2626' }}>
                                                            {esEntrada ? `+${cantEntera}` : `-${cantEntera}`} {unidadCant}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 'bold', color: '#334155' }}>
                                                            {stockNuevoEntero} {unidadStock}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ color: '#64748b' }}>
                                                            {m.usuario_nombre || 'Sistema'}
                                                        </TableCell>
                                                        <TableCell sx={{ color: '#475569' }}>
                                                            {m.motivo || (m.orden_titulo ? `Orden: ${m.orden_titulo}` : '-')}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}
                </Paper>

                {/* ==================================================================== */}
                {/* MODAL: CREAR / EDITAR ÍTEM */}
                {/* ==================================================================== */}
                <Dialog open={openModalItem} onClose={() => setOpenModalItem(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
                    <form onSubmit={handleGuardarItem}>
                        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                            {itemEditando ? "Editar Ítem de Inventario" : "Registrar Nuevo Ítem"}
                        </DialogTitle>
                        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '20px !important' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Código / SKU"
                                    required
                                    fullWidth
                                    value={formItem.codigo}
                                    onChange={(e) => setFormItem({ ...formItem, codigo: e.target.value })}
                                />
                                <TextField
                                    select
                                    label="Tipo de Ítem"
                                    required
                                    fullWidth
                                    value={formItem.tipo}
                                    onChange={(e) => handleCambioTipo(e.target.value)}
                                >
                                    <MenuItem value="MATERIAL">Material</MenuItem>
                                    <MenuItem value="HERRAMIENTA">Herramienta</MenuItem>
                                </TextField>
                            </Box>

                            <TextField
                                label="Nombre del Ítem"
                                required
                                fullWidth
                                value={formItem.nombre}
                                onChange={(e) => setFormItem({ ...formItem, nombre: e.target.value })}
                            />

                            <TextField
                                key={formItem.tipo}
                                label={formItem.tipo === 'HERRAMIENTA' ? "Detalles" : "Descripción"}
                                multiline
                                rows={2}
                                fullWidth
                                value={formItem.descripcion}
                                onChange={(e) => setFormItem({ ...formItem, descripcion: e.target.value })}
                            />

                            {/* CAMPOS EXCLUSIVOS PARA MATERIALES */}
                            {formItem.tipo === 'MATERIAL' && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Unidad de Medida"
                                        required
                                        fullWidth
                                        value={formItem.unidad_medida}
                                        onChange={(e) => setFormItem({ ...formItem, unidad_medida: e.target.value })}
                                    />

                                    <TextField
                                        label="Stock Mínimo (Alerta)"
                                        type="number"
                                        required
                                        fullWidth
                                        value={formItem.stock_minimo}
                                        onChange={(e) => setFormItem({ ...formItem, stock_minimo: e.target.value })}
                                        helperText="Avisará cuando queden menos de esta cantidad."
                                    />
                                </Box>
                            )}

                            {/* STOCK ACTUAL / EXISTENCIAS (EDITABLE TANTO AL CREAR COMO AL EDITAR) */}
                            {formItem.tipo === 'MATERIAL' ? (
                                <TextField
                                    label="Existencias / Stock Actual"
                                    type="number"
                                    required
                                    fullWidth
                                    value={formItem.stock_actual}
                                    onChange={(e) => setFormItem({ ...formItem, stock_actual: e.target.value })}
                                    InputProps={{ inputProps: { min: 0, step: "any" } }}
                                />
                            ) : (
                                <TextField
                                    label="Cantidad de Herramientas"
                                    type="number"
                                    required
                                    fullWidth
                                    value={formItem.stock_actual}
                                    onChange={(e) => setFormItem({ ...formItem, stock_actual: e.target.value })}
                                    InputProps={{ inputProps: { min: 0, step: 1 } }}
                                />
                            )}

                            {/* CAMPOS EXCLUSIVOS PARA HERRAMIENTAS */}
                            {formItem.tipo === 'HERRAMIENTA' && (
                                <TextField
                                    select
                                    label="Estado Actual de la Herramienta"
                                    fullWidth
                                    value={formItem.estado_herramienta}
                                    onChange={(e) => setFormItem({ ...formItem, estado_herramienta: e.target.value })}
                                >
                                    <MenuItem value="DISPONIBLE">Disponible en Almacén</MenuItem>
                                    <MenuItem value="EN_USO">En Uso</MenuItem>
                                    <MenuItem value="MANTENIMIENTO">En Mantenimiento</MenuItem>
                                    <MenuItem value="BAJA">Dada de Baja</MenuItem>
                                </TextField>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5 }}>
                            <Button onClick={() => setOpenModalItem(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="contained" disabled={saving} sx={{ textTransform: 'none', borderRadius: '10px', px: 3, fontWeight: 'bold' }}>
                                {saving ? <CircularProgress size={24} /> : "Guardar Ítem"}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* ==================================================================== */}
                {/* MODAL: REGISTRAR ENTRADA / COMPRA */}
                {/* ==================================================================== */}
                <Dialog open={openModalEntrada} onClose={() => setOpenModalEntrada(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
                    <form onSubmit={handleGuardarEntrada}>
                        <DialogTitle sx={{ fontWeight: 'bold' }}>
                            Entrada de Stock
                        </DialogTitle>
                        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {itemSeleccionado && (
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="#1e293b">
                                        {itemSeleccionado.nombre}
                                    </Typography>
                                    <Typography variant="caption" color="#64748b">
                                        Stock actual: <strong>{(() => {
                                            const info = formatearStockTexto(itemSeleccionado.stock_actual, itemSeleccionado.unidad_medida);
                                            return `${info.num} ${info.unidad}`;
                                        })()}</strong>
                                    </Typography>
                                </Box>
                            )}

                            <TextField
                                label="Cantidad a Ingresar"
                                type="number"
                                required
                                autoFocus
                                fullWidth
                                inputProps={{ min: "0.01", step: "any" }}
                                value={cantidadEntrada}
                                onChange={(e) => setCantidadEntrada(e.target.value)}
                            />

                            <TextField
                                label="Motivo o Número de Factura / Proveedor"
                                fullWidth
                                multiline
                                rows={2}
                                value={motivoEntrada}
                                onChange={(e) => setMotivoEntrada(e.target.value)}
                            />
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setOpenModalEntrada(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="contained" color="success" disabled={saving} sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
                                {saving ? <CircularProgress size={24} /> : "Registrar Entrada"}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* ==================================================================== */}
                {/* MODAL: CONFIRMAR ELIMINACIÓN */}
                {/* ==================================================================== */}
                <Dialog open={openModalDelete} onClose={() => setOpenModalDelete(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#dc2626' }}>
                        ¿Eliminar Ítem?
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="#475569">
                            ¿Estás seguro de eliminar el ítem <strong>{itemSeleccionado?.nombre}</strong> ({itemSeleccionado?.codigo})? Esta acción no se puede deshacer.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenModalDelete(false)} sx={{ textTransform: 'none', color: '#64748b' }}>
                            Cancelar
                        </Button>
                        <Button variant="contained" color="error" onClick={handleConfirmarEliminar} disabled={saving} sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
                            {saving ? <CircularProgress size={24} /> : "Eliminar"}
                        </Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Box>
    );
}
