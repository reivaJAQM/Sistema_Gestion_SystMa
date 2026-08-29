import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, TextField, Button, Typography, Paper,
    Alert, Tabs, Tab, Box, Card, CardContent,
    Avatar, Chip, CircularProgress, IconButton, Divider, Stack,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Snackbar, Tooltip, InputAdornment
} from '@mui/material';
import {
    IconUsers,
    IconUserPlus,
    IconUser,
    IconId,
    IconPhone,
    IconMail,
    IconEdit,
    IconTrash,
    IconSearch,
    IconRefresh,
    IconAlertTriangle,
    IconLock,
    IconInfoCircle,
    IconCheck
} from '@tabler/icons-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// ---------- TARJETA DE CLIENTE ----------
function ClienteCard({ cliente, onEdit, onDelete }) {
    const initials = `${cliente.first_name?.[0] ?? ''}${cliente.last_name?.[0] ?? ''}`.toUpperCase()
        || cliente.cedula?.[0]
        || cliente.username?.[0]?.toUpperCase();

    const cedulaMostrada = cliente.cedula || cliente.username;

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3,
                transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
                borderColor: '#e2e8f0',
                '&:hover': { 
                    boxShadow: '0 8px 24px rgba(2, 136, 209, 0.12)', 
                    borderColor: '#0288d1',
                    transform: 'translateY(-2px)'
                },
            }}
        >
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Avatar 
                    sx={{ 
                        width: 52, 
                        height: 52, 
                        bgcolor: '#0288d1', 
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        boxShadow: '0 2px 8px rgba(2, 136, 209, 0.3)'
                    }}
                >
                    {initials || <IconUser size={24} />}
                </Avatar>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight="700" color="#1e293b" noWrap>
                        {cliente.first_name} {cliente.last_name}
                    </Typography>

                    {/* CÉDULA / USUARIO */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4 }}>
                        <IconId size={15} color="#0288d1" />
                        <Typography variant="body2" fontWeight="600" color="text.secondary" noWrap>
                            C.I. {cedulaMostrada}
                        </Typography>
                    </Box>

                    {/* TELÉFONO */}
                    {cliente.telefono && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4 }}>
                            <IconPhone size={15} color="#16a34a" />
                            <Typography
                                variant="caption"
                                component="a"
                                href={`tel:${cliente.telefono}`}
                                sx={{
                                    color: '#16a34a',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                                noWrap
                            >
                                {cliente.telefono}
                            </Typography>
                        </Box>
                    )}

                    {/* CORREO */}
                    {cliente.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4 }}>
                            <IconMail size={15} color="#64748b" />
                            <Typography
                                variant="caption"
                                component="a"
                                href={`mailto:${cliente.email}`}
                                sx={{
                                    color: '#475569',
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline', color: '#0288d1' }
                                }}
                                noWrap
                            >
                                {cliente.email}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ mt: 1.2, display: 'flex', gap: 0.8, alignItems: 'center' }}>
                        <Chip 
                            label="Cliente" 
                            size="small" 
                            sx={{ 
                                bgcolor: '#e0f2fe', 
                                color: '#0369a1', 
                                fontWeight: 700, 
                                fontSize: '0.72rem',
                                height: 22
                            }} 
                        />
                    </Box>
                </Box>

                {/* ACCIONES */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Tooltip title="Editar Cliente">
                        <IconButton 
                            size="small" 
                            sx={{ color: '#0288d1', bgcolor: '#f0f9ff', '&:hover': { bgcolor: '#e0f2fe' } }} 
                            onClick={() => onEdit(cliente)}
                        >
                            <IconEdit size={17} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar Cliente">
                        <IconButton 
                            size="small" 
                            sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }} 
                            onClick={() => onDelete(cliente)}
                        >
                            <IconTrash size={17} />
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
    const [editForm, setEditForm] = useState({ cedula: '', first_name: '', last_name: '', telefono: '', email: '', password: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Modal eliminar
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteCliente, setDeleteCliente] = useState(null);
    const [deleteInfo, setDeleteInfo] = useState({ loading: false, ordenes: [] });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Formulario creación
    const [formData, setFormData] = useState({ first_name: '', last_name: '', cedula: '', telefono: '', email: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // ---------- CARGA DE DATOS ----------
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
        const q = busqueda.toLowerCase().trim();
        const cedula = (c.cedula || c.username || '').toLowerCase();
        const nombre = (c.first_name || '').toLowerCase();
        const apellido = (c.last_name || '').toLowerCase();
        const nombreCompleto = `${nombre} ${apellido}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const telefono = (c.telefono || '').toLowerCase();

        return (
            cedula.includes(q) ||
            nombre.includes(q) ||
            apellido.includes(q) ||
            nombreCompleto.includes(q) ||
            email.includes(q) ||
            telefono.includes(q)
        );
    });

    // ---------- EDICIÓN ----------
    const handleOpenEdit = (c) => {
        setEditCliente(c);
        setEditForm({
            cedula: c.cedula || c.username || '',
            first_name: c.first_name ?? '',
            last_name: c.last_name ?? '',
            telefono: c.telefono ?? '',
            email: c.email ?? '',
            password: ''
        });
        setEditError('');
        setEditOpen(true);
    };
    
    const handleCloseEdit = () => { 
        setEditOpen(false); 
        setEditCliente(null); 
    };

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
                setEditError('Error al actualizar los datos del cliente.');
            }
        } finally {
            setEditLoading(false);
        }
    };

    // ---------- ELIMINACIÓN ----------
    const handleOpenDelete = async (c) => {
        if (c.id === loggedUserId) { 
            showSnack('No puedes eliminar tu propia cuenta.', 'warning'); 
            return; 
        }
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
    
    const handleCloseDelete = () => { 
        setDeleteOpen(false); 
        setDeleteCliente(null); 
    };

    const handleConfirmDelete = async () => {
        setDeleteLoading(true);
        try {
            await api.delete(`clientes/${deleteCliente.id}/`);
            await cargarClientes();
            handleCloseDelete();
            showSnack(`Cliente "${deleteCliente.first_name || deleteCliente.username}" eliminado con éxito.`, 'info');
        } catch {
            showSnack('Error al eliminar el cliente.', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ---------- CREACIÓN ----------
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.cedula.trim()) {
            setCreateError('La cédula o documento de identidad es obligatorio.');
            return;
        }
        if (!formData.email.trim()) {
            setCreateError('El correo electrónico es obligatorio para enviar las credenciales.');
            return;
        }
        setCreateLoading(true);
        setCreateError('');
        try {
            await api.post('clientes/', formData);
            setFormData({ first_name: '', last_name: '', cedula: '', telefono: '', email: '' });
            await cargarClientes();
            setTabValue(0);
            showSnack('Cliente registrado exitosamente. Se han enviado las credenciales por correo electrónico.');
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
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                {/* CABECERA */}
                <Box sx={{ bgcolor: '#0288d1', p: 3.5, color: 'white' }}>
                    <Typography variant="h5" fontWeight="800">Gestión de Clientes</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                        Directorio, registro y administración de clientes del sistema
                    </Typography>
                </Box>

                {/* PESTAÑAS */}
                <Tabs 
                    value={tabValue} 
                    onChange={(_, v) => { setTabValue(v); setBusqueda(''); }} 
                    variant="fullWidth" 
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        '& .MuiTab-root': { fontWeight: 700, py: 2 }
                    }}
                >
                    <Tab 
                        icon={<IconUsers size={20} />} 
                        label={`Directorio de Clientes (${clientes.length})`} 
                        iconPosition="start" 
                    />
                    <Tab 
                        icon={<IconUserPlus size={20} />} 
                        label="Registrar Nuevo Cliente" 
                        iconPosition="start" 
                    />
                </Tabs>

                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>

                    {/* ====== TAB 0 — DIRECTORIO ====== */}
                    {tabValue === 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="800" color="#1e293b">Directorio Activo</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Consulta, contacta o administra a los clientes registrados
                                    </Typography>
                                </Box>
                                <Tooltip title="Actualizar listado">
                                    <IconButton onClick={cargarClientes} color="primary" sx={{ bgcolor: '#f0f9ff' }}>
                                        <IconRefresh size={20} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            {/* Buscador */}
                            <TextField
                                fullWidth 
                                variant="outlined" 
                                size="small"
                                placeholder="Buscar por cédula, nombre, teléfono o correo..."
                                value={busqueda} 
                                onChange={e => setBusqueda(e.target.value)}
                                sx={{ mb: 3.5 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconSearch size={20} color="#64748b" />
                                        </InputAdornment>
                                    )
                                }}
                            />

                            {loading ? (
                                <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
                            ) : clientesFiltrados.length === 0 ? (
                                <Box textAlign="center" py={6}>
                                    <IconUsers size={56} stroke={1.5} color="#94a3b8" style={{ marginBottom: 12 }} />
                                    <Typography variant="body1" color="text.secondary" fontWeight="600">
                                        {busqueda ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados aún en el sistema.'}
                                    </Typography>
                                    {!busqueda && (
                                        <Button 
                                            variant="contained" 
                                            startIcon={<IconUserPlus size={18} />}
                                            sx={{ mt: 2.5, borderRadius: 2, bgcolor: '#0288d1' }} 
                                            onClick={() => setTabValue(1)}
                                        >
                                            Registrar primer cliente
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2.5 }}>
                                    {clientesFiltrados.map(c => (
                                        <ClienteCard 
                                            key={c.id} 
                                            cliente={c} 
                                            onEdit={handleOpenEdit} 
                                            onDelete={handleOpenDelete} 
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* ====== TAB 1 — REGISTRAR ====== */}
                    {tabValue === 1 && (
                        <Box component="form" onSubmit={handleCreate} sx={{ maxWidth: 720, mx: 'auto', mt: 1 }}>
                            <Typography variant="h6" fontWeight="800" align="center" sx={{ mb: 0.5, color: '#1e293b' }}>
                                Formulario de Alta de Cliente
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3.5 }}>
                                Ingresa la información personal y de contacto del cliente
                            </Typography>

                            {createError && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    {createError}
                                </Alert>
                            )}

                            <Stack spacing={3}>
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField 
                                        fullWidth 
                                        label="Nombre(s)" 
                                        value={formData.first_name} 
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })} 
                                        required 
                                    />
                                    <TextField 
                                        fullWidth 
                                        label="Apellido(s)" 
                                        value={formData.last_name} 
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })} 
                                        required 
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField 
                                        fullWidth 
                                        label="Cédula / Documento de Identidad" 
                                        placeholder="Ej: 0912345678"
                                        value={formData.cedula} 
                                        onChange={e => setFormData({ ...formData, cedula: e.target.value })} 
                                        required 
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><IconId size={18} color="#64748b" /></InputAdornment>
                                        }}
                                        helperText="Será su usuario y contraseña provisional de acceso al portal"
                                    />
                                    <TextField 
                                        fullWidth 
                                        label="Teléfono de Contacto" 
                                        placeholder="Ej: +593 99 123 4567"
                                        value={formData.telefono} 
                                        onChange={e => setFormData({ ...formData, telefono: e.target.value })} 
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><IconPhone size={18} color="#64748b" /></InputAdornment>
                                        }}
                                    />
                                </Box>

                                <TextField 
                                    fullWidth 
                                    type="email" 
                                    label="Correo Electrónico" 
                                    placeholder="cliente@ejemplo.com"
                                    value={formData.email} 
                                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                    required 
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><IconMail size={18} color="#64748b" /></InputAdornment>
                                    }}
                                    helperText="Se enviará a este correo la confirmación de registro y las credenciales"
                                />

                                <Alert 
                                    severity="info" 
                                    icon={<IconInfoCircle size={22} />}
                                    sx={{ borderRadius: 2, bgcolor: '#f0f9ff', borderColor: '#bae6fd', border: '1px solid' }}
                                >
                                    <Typography variant="body2" fontWeight="700" color="#0369a1" gutterBottom>
                                        Acceso y Clave de Seguridad:
                                    </Typography>
                                    <Typography variant="caption" color="#0c4a6e" component="div" sx={{ lineHeight: 1.6 }}>
                                        • <strong>Usuario:</strong> Número de Cédula.<br />
                                        • <strong>Contraseña inicial:</strong> Número de Cédula.<br />
                                        • <strong>Seguridad:</strong> El sistema exigirá obligatoriamente al cliente cambiar su contraseña en su primer inicio de sesión.
                                    </Typography>
                                </Alert>

                                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        size="large" 
                                        disabled={createLoading}
                                        startIcon={!createLoading && <IconUserPlus size={20} />}
                                        sx={{ 
                                            minWidth: 280, 
                                            borderRadius: 2.5, 
                                            py: 1.5,
                                            fontSize: '1rem', 
                                            fontWeight: 'bold', 
                                            bgcolor: '#0288d1', 
                                            '&:hover': { bgcolor: '#01579b' } 
                                        }}
                                    >
                                        {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Registrar Cliente'}
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* ====== MODAL EDITAR ====== */}
            <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1e293b' }}>
                    <IconEdit size={22} color="#0288d1" /> Editar Datos del Cliente
                </DialogTitle>
                <DialogContent dividers>
                    {editError && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{editError}</Alert>}
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField 
                                fullWidth 
                                label="Nombre(s)" 
                                value={editForm.first_name} 
                                onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} 
                                required 
                            />
                            <TextField 
                                fullWidth 
                                label="Apellido(s)" 
                                value={editForm.last_name} 
                                onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} 
                                required 
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField 
                                fullWidth 
                                label="Cédula / Documento" 
                                value={editForm.cedula} 
                                onChange={e => setEditForm({ ...editForm, cedula: e.target.value })} 
                                required 
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><IconId size={18} color="#64748b" /></InputAdornment>
                                }}
                            />
                            <TextField 
                                fullWidth 
                                label="Teléfono" 
                                value={editForm.telefono} 
                                onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} 
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><IconPhone size={18} color="#64748b" /></InputAdornment>
                                }}
                            />
                        </Box>

                        <TextField 
                            fullWidth 
                            type="email" 
                            label="Correo Electrónico" 
                            value={editForm.email} 
                            onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><IconMail size={18} color="#64748b" /></InputAdornment>
                            }}
                        />

                        <TextField
                            fullWidth 
                            type="password" 
                            label="Nueva Contraseña (dejar en blanco para conservar la actual)"
                            value={editForm.password} 
                            onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                            InputProps={{ 
                                startAdornment: <InputAdornment position="start"><IconLock size={18} color="#64748b" /></InputAdornment> 
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <Button onClick={handleCloseEdit} disabled={editLoading} sx={{ borderRadius: 2 }}>Cancelar</Button>
                    <Button 
                        onClick={handleEditSubmit} 
                        variant="contained" 
                        disabled={editLoading}
                        startIcon={!editLoading && <IconCheck size={18} />}
                        sx={{ borderRadius: 2, bgcolor: '#0288d1', '&:hover': { bgcolor: '#01579b' } }}
                    >
                        {editLoading ? <CircularProgress size={22} color="inherit" /> : 'Guardar Cambios'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ====== MODAL ELIMINAR ====== */}
            <Dialog open={deleteOpen} onClose={handleCloseDelete} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444' }}>
                    <IconTrash size={22} /> Eliminar Cliente
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#334155', fontWeight: 500 }}>
                        ¿Estás seguro de que deseas eliminar al cliente <strong>{deleteCliente?.first_name} {deleteCliente?.last_name}</strong> (C.I. {deleteCliente?.cedula || deleteCliente?.username})?
                    </DialogContentText>
                    
                    {deleteInfo.loading && (
                        <Box display="flex" justifyContent="center" mt={2.5}><CircularProgress size={24} /></Box>
                    )}
                    
                    {!deleteInfo.loading && deleteInfo.ordenes.length > 0 && (
                        <Alert 
                            severity="error" 
                            icon={<IconAlertTriangle size={22} />} 
                            sx={{ mt: 2.5, borderRadius: 2 }}
                        >
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Tiene {deleteInfo.ordenes.length} orden{deleteInfo.ordenes.length !== 1 ? 'es' : ''} de trabajo registrada{deleteInfo.ordenes.length !== 1 ? 's' : ''}.
                            </Typography>
                            <Typography variant="caption" component="div">
                                <strong>¡Atención!</strong> Al ser el titular de esas órdenes, <strong>todas se eliminarán permanentemente</strong> junto con sus bitácoras y registros.
                            </Typography>
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <Button onClick={handleCloseDelete} disabled={deleteLoading} sx={{ borderRadius: 2 }}>Cancelar</Button>
                    <Button 
                        onClick={handleConfirmDelete} 
                        variant="contained" 
                        color="error"
                        disabled={deleteLoading || deleteInfo.loading}
                        startIcon={!deleteLoading && <IconTrash size={18} />}
                        sx={{ borderRadius: 2 }}
                    >
                        {deleteLoading ? <CircularProgress size={22} color="inherit" /> : 'Sí, eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ====== SNACKBAR ====== */}
            <Snackbar 
                open={snack.open} 
                autoHideDuration={4000}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Container>
    );
}
