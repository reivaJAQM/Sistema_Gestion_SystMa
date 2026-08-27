import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, TextField, Button, Typography, Paper,
    Alert, Tabs, Tab, Box, Card, CardContent,
    Avatar, Chip, CircularProgress, IconButton, Divider, Stack,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Snackbar, Tooltip, InputAdornment
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// ---------- TARJETA DE CLIENTE ----------
function ClienteCard({ cliente, onEdit, onDelete }) {
    const initials = `${cliente.first_name?.[0] ?? ''}${cliente.last_name?.[0] ?? ''}`.toUpperCase()
        || cliente.username?.[0]?.toUpperCase();

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 2,
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': { boxShadow: 4, borderColor: '#0288d1' },
            }}
        >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '14px !important' }}>
                <Avatar sx={{ width: 50, height: 50, bgcolor: '#0288d1', fontWeight: 700 }}>
                    {initials || <PersonIcon />}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {cliente.first_name} {cliente.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        @{cliente.username}
                    </Typography>
                    {cliente.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            <EmailIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                            <Typography
                                variant="caption" noWrap
                                component="a" href={`mailto:${cliente.email}`}
                                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                                {cliente.email}
                            </Typography>
                        </Box>
                    )}
                    <Chip label="Cliente" size="small" color="info" variant="outlined" sx={{ mt: 0.5 }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => onEdit(cliente)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => onDelete(cliente)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardContent>
        </Card>
    );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function GestionClientes() {
    const navigate = useNavigate();
    const userRol = localStorage.getItem('user_rol');
    const loggedUserId = parseInt(localStorage.getItem('user_id'));

    const [tabValue, setTabValue] = useState(0);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
    const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

    // Modal editar
    const [editOpen, setEditOpen] = useState(false);
    const [editCliente, setEditCliente] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', first_name: '', last_name: '', email: '', password: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Modal eliminar
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteCliente, setDeleteCliente] = useState(null);
    const [deleteInfo, setDeleteInfo] = useState({ loading: false, ordenes: [] });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Formulario creación
    const [formData, setFormData] = useState({ username: '', first_name: '', last_name: '', email: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // ---------- CARGA ----------
    const cargarClientes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('clientes/');
            setClientes(res.data);
        } catch (e) {
            console.error('Error cargando clientes', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
      if (userRol === 'Cliente' || userRol === 'Tecnico') {
        navigate('/mis-solicitudes');
        return;
      }
      cargarClientes(); 
    }, [cargarClientes, navigate, userRol]);

    // Filtrado por búsqueda
    const clientesFiltrados = clientes.filter(c => {
        const q = busqueda.toLowerCase();
        return (
            c.username?.toLowerCase().includes(q) ||
            c.first_name?.toLowerCase().includes(q) ||
            c.last_name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        );
    });

    // ---------- EDICIÓN ----------
    const handleOpenEdit = (c) => {
        setEditCliente(c);
        setEditForm({ username: c.username, first_name: c.first_name ?? '', last_name: c.last_name ?? '', email: c.email ?? '', password: '' });
        setEditError('');
        setEditOpen(true);
    };
    const handleCloseEdit = () => { setEditOpen(false); setEditCliente(null); };

    const handleEditSubmit = async () => {
        setEditLoading(true);
        setEditError('');
        try {
            const payload = { ...editForm };
            if (!payload.password) delete payload.password;
            await api.put(`clientes/${editCliente.id}/`, payload);
            await cargarClientes();
            handleCloseEdit();
            showSnack(`Cliente "${editForm.first_name} ${editForm.last_name}" actualizado.`);
        } catch (err) {
            const detail = err.response?.data;
            if (typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                setEditError(msgs);
            } else {
                setEditError('Error al actualizar el cliente.');
            }
        } finally {
            setEditLoading(false);
        }
    };

    // ---------- ELIMINACIÓN ----------
    const handleOpenDelete = async (c) => {
        if (c.id === loggedUserId) { showSnack('No puedes eliminar tu propia cuenta.', 'warning'); return; }
        setDeleteCliente(c);
        setDeleteInfo({ loading: true, ordenes: [] });
        setDeleteOpen(true);
        try {
            const res = await api.get(`ordenes/?cliente=${c.id}`);
            setDeleteInfo({ loading: false, ordenes: res.data });
        } catch {
            setDeleteInfo({ loading: false, ordenes: [] });
        }
    };
    const handleCloseDelete = () => { setDeleteOpen(false); setDeleteCliente(null); };

    const handleConfirmDelete = async () => {
        setDeleteLoading(true);
        try {
            await api.delete(`clientes/${deleteCliente.id}/`);
            await cargarClientes();
            handleCloseDelete();
            showSnack(`Cliente "${deleteCliente.username}" eliminado.`, 'info');
        } catch {
            showSnack('Error al eliminar el cliente.', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ---------- CREACIÓN ----------
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            setCreateError('El correo electrónico es obligatorio.');
            return;
        }
        setCreateLoading(true);
        setCreateError('');
        try {
            await api.post('clientes/', formData);
            setFormData({ username: '', first_name: '', last_name: '', email: '' });
            await cargarClientes();
            setTabValue(0);
            showSnack('Cliente registrado exitosamente. Se ha enviado la contraseña temporal por correo.');
        } catch (err) {
            const detail = err.response?.data;
            if (typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                setCreateError(msgs);
            } else {
                setCreateError('Error al registrar el cliente.');
            }
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>

                {/* CABECERA */}
                <Box sx={{ bgcolor: '#0288d1', p: 3, color: 'white' }}>
                    <Typography variant="h5" fontWeight="bold">Gestión de Clientes</Typography>
                    <Typography variant="body2">Registro y administración de clientes del sistema</Typography>
                </Box>

                {/* TABS */}
                <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); setBusqueda(''); }} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab icon={<GroupIcon />} label={`Directorio (${clientes.length})`} iconPosition="start" />
                    <Tab icon={<PersonAddIcon />} label="Registrar Cliente" iconPosition="start" />
                </Tabs>

                <Box sx={{ p: { xs: 2, sm: 4 } }}>

                    {/* ====== TAB 0 — DIRECTORIO ====== */}
                    {tabValue === 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Directorio de Clientes</Typography>
                                <Tooltip title="Recargar">
                                    <IconButton onClick={cargarClientes} color="primary"><RefreshIcon /></IconButton>
                                </Tooltip>
                            </Box>

                            {/* Buscador */}
                            <TextField
                                fullWidth variant="outlined" size="small"
                                placeholder="Buscar por nombre, usuario o correo..."
                                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                sx={{ mb: 3 }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><PersonIcon color="action" fontSize="small" /></InputAdornment>
                                }}
                            />

                            {loading ? (
                                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                            ) : clientesFiltrados.length === 0 ? (
                                <Box textAlign="center" py={5}>
                                    <PersonIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                                    <Typography variant="body1" color="text.secondary">
                                        {busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay clientes registrados aún.'}
                                    </Typography>
                                    {!busqueda && (
                                        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setTabValue(1)}>
                                            Registrar primer cliente
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 2 }}>
                                    {clientesFiltrados.map(c => (
                                        <ClienteCard key={c.id} cliente={c} onEdit={handleOpenEdit} onDelete={handleOpenDelete} />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* ====== TAB 1 — REGISTRAR ====== */}
                    {tabValue === 1 && (
                        <Box component="form" onSubmit={handleCreate} sx={{ maxWidth: 700, mx: 'auto', mt: 2 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom align="center" sx={{ mb: 3 }}>
                                Datos del Nuevo Cliente
                            </Typography>
                            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
                            <Stack spacing={3}>
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField fullWidth label="Usuario (Login)" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                                    <TextField fullWidth label="Nombre" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} required />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField fullWidth label="Apellido" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} required />
                                    <TextField fullWidth type="email" label="Correo Electrónico" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </Box>
                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                    <strong>Contraseña Automática:</strong> Se generará una contraseña temporal segura y se enviará por correo electrónico al nuevo cliente. El cliente deberá cambiarla obligatoriamente en su primer inicio de sesión.
                                </Alert>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Button type="submit" variant="contained" size="large" disabled={createLoading}
                                        sx={{ minWidth: 280, borderRadius: 2, fontSize: '1rem', fontWeight: 'bold', bgcolor: '#0288d1', '&:hover': { bgcolor: '#01579b' } }}>
                                        {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Registrar Cliente'}
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* ====== MODAL EDITAR ====== */}
            <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight="bold">Editar Cliente</DialogTitle>
                <DialogContent dividers>
                    {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField fullWidth label="Usuario" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} required />
                            <TextField fullWidth label="Nombre" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} required />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField fullWidth label="Apellido" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} required />
                            <TextField fullWidth type="email" label="Correo" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                        </Box>
                        <TextField
                            fullWidth type="password" label="Nueva Contraseña (vacío = no cambiar)"
                            value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                            InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment> }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleCloseEdit} disabled={editLoading}>Cancelar</Button>
                    <Button onClick={handleEditSubmit} variant="contained" disabled={editLoading}>
                        {editLoading ? <CircularProgress size={22} color="inherit" /> : 'Guardar Cambios'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ====== MODAL ELIMINAR ====== */}
            <Dialog open={deleteOpen} onClose={handleCloseDelete} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeleteIcon color="error" /> Eliminar Cliente
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Eliminar al cliente <strong>@{deleteCliente?.username}</strong>?
                    </DialogContentText>
                    {deleteInfo.loading && <Box display="flex" justifyContent="center" mt={2}><CircularProgress size={24} /></Box>}
                    {!deleteInfo.loading && deleteInfo.ordenes.length > 0 && (
                        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Tiene {deleteInfo.ordenes.length} orden{deleteInfo.ordenes.length !== 1 ? 'es' : ''} de trabajo registrada{deleteInfo.ordenes.length !== 1 ? 's' : ''}.
                            </Typography>
                            <Typography variant="caption">
                                <strong>¡Atención!</strong> Al ser el titular de esas órdenes, <strong>todas se eliminarán permanentemente</strong> junto con sus avances y registros.
                            </Typography>
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleCloseDelete} disabled={deleteLoading}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error"
                        disabled={deleteLoading || deleteInfo.loading}>
                        {deleteLoading ? <CircularProgress size={22} color="inherit" /> : 'Sí, eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ====== SNACKBAR ====== */}
            <Snackbar open={snack.open} autoHideDuration={4000}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Container>
    );
}
