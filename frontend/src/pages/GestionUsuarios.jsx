import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, TextField, Button, Typography, Paper,
    MenuItem, Alert, Tabs, Tab, Box, Card, CardContent,
    Avatar, Chip, CircularProgress, IconButton, Divider, Stack,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Snackbar, Tooltip, InputAdornment
} from '@mui/material';
import {
    IconUsers,
    IconUserPlus,
    IconUser,
    IconTool,
    IconUserCheck,
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
    IconEyeOff,
    IconCheck
} from '@tabler/icons-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ROL_CONFIG = {
    Supervisor: { color: '#7b1fa2', icon: <IconUserCheck size={24} />, bgcolor: '#faf5ff', chipBg: '#f3e8ff', chipColor: '#7e22ce', label: 'Supervisor' },
    Tecnico:    { color: '#e65100', icon: <IconTool size={24} />,      bgcolor: '#fff7ed', chipBg: '#ffedd5', chipColor: '#c2410c', label: 'Técnico' },
};

// ---------- TARJETA DE USUARIO ----------
function UserCard({ user, onEdit, onDelete, editable = true }) {
    const cfg = ROL_CONFIG[user.rol_visual] ?? ROL_CONFIG.Tecnico;
    const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() 
        || user.cedula?.[0]
        || user.username?.[0]?.toUpperCase();

    const cedulaMostrada = user.cedula || user.username;

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3,
                transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
                borderColor: '#e2e8f0',
                '&:hover': { 
                    boxShadow: `0 8px 24px ${cfg.color}18`, 
                    borderColor: cfg.color,
                    transform: 'translateY(-2px)'
                },
            }}
        >
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Avatar 
                    sx={{ 
                        width: 52, 
                        height: 52, 
                        bgcolor: cfg.color, 
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        boxShadow: `0 2px 8px ${cfg.color}40`
                    }}
                >
                    {initials || cfg.icon}
                </Avatar>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight="700" color="#1e293b" noWrap>
                        {user.first_name} {user.last_name}
                    </Typography>

                    {/* CÉDULA / USUARIO */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4 }}>
                        <IconId size={15} color={cfg.color} />
                        <Typography variant="body2" fontWeight="600" color="text.secondary" noWrap>
                            C.I. {cedulaMostrada}
                        </Typography>
                    </Box>

                    {/* TELÉFONO */}
                    {user.telefono && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4 }}>
                            <IconPhone size={15} color="#16a34a" />
                            <Typography
                                variant="caption"
                                component="a"
                                href={`tel:${user.telefono}`}
                                sx={{
                                    color: '#16a34a',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                                noWrap
                            >
                                {user.telefono}
                            </Typography>
                        </Box>
                    )}

                    {/* CORREO */}
                    {user.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4 }}>
                            <IconMail size={15} color="#64748b" />
                            <Typography
                                variant="caption"
                                component="a"
                                href={`mailto:${user.email}`}
                                sx={{
                                    color: '#475569',
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline', color: cfg.color }
                                }}
                                noWrap
                            >
                                {user.email}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ mt: 1.2, display: 'flex', gap: 0.8, alignItems: 'center' }}>
                        <Chip 
                            label={cfg.label} 
                            size="small" 
                            sx={{ 
                                bgcolor: cfg.chipBg, 
                                color: cfg.chipColor, 
                                fontWeight: 700, 
                                fontSize: '0.72rem',
                                height: 22
                            }} 
                        />
                    </Box>
                </Box>

                {editable ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Tooltip title="Editar Personal">
                            <IconButton 
                                size="small" 
                                sx={{ color: cfg.color, bgcolor: cfg.bgcolor, '&:hover': { opacity: 0.85 } }} 
                                onClick={() => onEdit(user)}
                            >
                                <IconEdit size={17} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Personal">
                            <IconButton 
                                size="small" 
                                sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }} 
                                onClick={() => onDelete(user)}
                            >
                                <IconTrash size={17} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ) : (
                    <Tooltip title="Solo lectura">
                        <IconEyeOff size={18} color="#94a3b8" style={{ marginTop: 4 }} />
                    </Tooltip>
                )}
            </CardContent>
        </Card>
    );
}

// ---------- SECCIÓN DEL DIRECTORIO ----------
function DirectorioSection({ title, color, icon, users, onEdit, onDelete, editable }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ color, fontWeight: '800', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {icon} {title} ({users.length})
            </Typography>
            <Divider sx={{ mb: 2.5, bgcolor: color, height: 2, opacity: 0.3 }} />
            {users.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2.5 }}>
                    {users.map(u => (
                        <UserCard key={u.id} user={u} onEdit={onEdit} onDelete={onDelete} editable={editable} />
                    ))}
                </Box>
            ) : (
                <Typography variant="body2" sx={{ ml: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                    No hay personal registrado en esta categoría.
                </Typography>
            )}
        </Box>
    );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function GestionUsuarios() {
    const navigate = useNavigate();
    const userRol = localStorage.getItem('user_rol');
    const loggedUserId = parseInt(localStorage.getItem('user_id'));
    const esAdmin = userRol === 'Administrador';

    const [tabValue, setTabValue] = useState(0);
    const [personal, setPersonal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
    const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

    // Modal editar
    const [editOpen, setEditOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ cedula: '', first_name: '', last_name: '', telefono: '', email: '', password: '', rol: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Modal eliminar
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteUser, setDeleteUser] = useState(null);
    const [deleteInfo, setDeleteInfo] = useState({ loading: false, ordenes: [] });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Formulario creación
    const [formData, setFormData] = useState({ first_name: '', last_name: '', cedula: '', telefono: '', email: '', rol: 'Tecnico' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // ---------- CARGA DE PERSONAL ----------
    const cargarPersonal = useCallback(async () => {
        setLoading(true);
        try {
            const [resTecnicos, resSupervisores] = await Promise.allSettled([
                api.get('tecnicos/'),
                api.get('supervisores/'),
            ]);
            const extract = (r, rol) => r.status === 'fulfilled' ? r.value.data.map(u => ({ ...u, rol_visual: rol })) : [];
            const tecnicos     = extract(resTecnicos,    'Tecnico');
            const supervisores = extract(resSupervisores,'Supervisor');
            setPersonal([...supervisores, ...tecnicos]);
        } catch (e) {
            console.error('Error cargando personal', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        if (userRol === 'Cliente' || userRol === 'Tecnico') {
            navigate('/mis-solicitudes');
            return;
        }
        cargarPersonal(); 
    }, [cargarPersonal, navigate, userRol]);

    // Filtrado por búsqueda
    const personalFiltrado = personal.filter(p => {
        const q = busqueda.toLowerCase().trim();
        const cedula = (p.cedula || p.username || '').toLowerCase();
        const nombre = (p.first_name || '').toLowerCase();
        const apellido = (p.last_name || '').toLowerCase();
        const nombreCompleto = `${nombre} ${apellido}`.toLowerCase();
        const email = (p.email || '').toLowerCase();
        const telefono = (p.telefono || '').toLowerCase();

        return (
            cedula.includes(q) ||
            nombre.includes(q) ||
            apellido.includes(q) ||
            nombreCompleto.includes(q) ||
            email.includes(q) ||
            telefono.includes(q)
        );
    });

    const listaSupervisores = personalFiltrado.filter(p => p.rol_visual === 'Supervisor');
    const listaTecnicos     = personalFiltrado.filter(p => p.rol_visual === 'Tecnico');

    // ---------- EDICIÓN (solo Admin) ----------
    const handleOpenEdit = (user) => {
        setEditUser(user);
        setEditForm({
            cedula: user.cedula || user.username || '',
            first_name: user.first_name ?? '',
            last_name: user.last_name ?? '',
            telefono: user.telefono ?? '',
            email: user.email ?? '',
            password: '',
            rol: user.rol_visual ?? '',
        });
        setEditError('');
        setEditOpen(true);
    };
    
    const handleCloseEdit = () => { 
        setEditOpen(false); 
        setEditUser(null); 
    };

    const handleEditSubmit = async () => {
        setEditLoading(true);
        setEditError('');
        try {
            const payload = { ...editForm };
            if (!payload.password) delete payload.password;
            if (!payload.rol) delete payload.rol;
            await api.put(`crear-usuario/${editUser.id}/`, payload);
            await cargarPersonal();
            handleCloseEdit();
            showSnack(`Personal "${editForm.first_name} ${editForm.last_name}" actualizado correctamente.`);
        } catch (err) {
            const detail = err.response?.data;
            if (typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                setEditError(msgs);
            } else {
                setEditError('Error al actualizar el personal.');
            }
        } finally {
            setEditLoading(false);
        }
    };

    // ---------- ELIMINACIÓN (solo Admin) ----------
    const handleOpenDelete = async (user) => {
        if (user.id === loggedUserId) { 
            showSnack('No puedes eliminar tu propia cuenta.', 'warning'); 
            return; 
        }
        setDeleteUser(user);
        setDeleteInfo({ loading: true, ordenes: [] });
        setDeleteOpen(true);
        try {
            const paramKey = user.rol_visual === 'Tecnico' ? 'tecnico' : 'supervisor';
            const res = await api.get(`ordenes/?${paramKey}=${user.id}`);
            setDeleteInfo({ loading: false, ordenes: res.data });
        } catch {
            setDeleteInfo({ loading: false, ordenes: [] });
        }
    };
    
    const handleCloseDelete = () => { 
        setDeleteOpen(false); 
        setDeleteUser(null); 
    };

    const handleConfirmDelete = async () => {
        setDeleteLoading(true);
        try {
            await api.delete(`crear-usuario/${deleteUser.id}/`);
            await cargarPersonal();
            handleCloseDelete();
            showSnack(`Personal "${deleteUser.first_name || deleteUser.username}" eliminado con éxito.`, 'info');
        } catch {
            showSnack('Error al eliminar el usuario.', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ---------- CREACIÓN (solo Admin) ----------
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
            const payload = {
                cedula: formData.cedula,
                first_name: formData.first_name,
                last_name: formData.last_name,
                telefono: formData.telefono,
                email: formData.email,
                rol: formData.rol,
            };
            await api.post('crear-usuario/', payload);
            setFormData({ first_name: '', last_name: '', cedula: '', telefono: '', email: '', rol: 'Tecnico' });
            await cargarPersonal();
            setTabValue(0);
            showSnack('Personal registrado exitosamente. Se han enviado las credenciales por correo.');
        } catch (err) {
            const detail = err.response?.data;
            if (typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                setCreateError(msgs);
            } else {
                setCreateError('Error al registrar el personal.');
            }
        } finally {
            setCreateLoading(false);
        }
    };

    // Tabs disponibles: solo Admin tiene la pestaña de "Registrar"
    const tabs = esAdmin
        ? [{ label: `Directorio (${personal.length})`, icon: <IconUsers size={20} /> }, { label: 'Registrar Personal', icon: <IconUserPlus size={20} /> }]
        : [{ label: `Directorio (${personal.length})`, icon: <IconUsers size={20} /> }];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                {/* CABECERA */}
                <Box sx={{ bgcolor: '#1976d2', p: 3.5, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="800">Gestión de Personal Operativo</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            {esAdmin ? 'Administra a los técnicos de campo y supervisores del sistema' : 'Directorio del personal operativo'}
                        </Typography>
                    </Box>
                    {!esAdmin && (
                        <Chip
                            label="Solo lectura"
                            size="small"
                            icon={<IconEyeOff size={16} color="white" />}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.5)', border: '1px solid', fontWeight: 600 }}
                        />
                    )}
                </Box>

                {/* TABS */}
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
                    {tabs.map((t, i) => (
                        <Tab key={i} icon={t.icon} label={t.label} iconPosition="start" />
                    ))}
                </Tabs>

                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>

                    {/* ====== TAB 0 — DIRECTORIO ====== */}
                    {tabValue === 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="800" color="#1e293b">Directorio de Equipo</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Supervisores de operaciones y técnicos de campo activos
                                    </Typography>
                                </Box>
                                <Tooltip title="Actualizar listado">
                                    <IconButton onClick={cargarPersonal} color="primary" sx={{ bgcolor: '#eff6ff' }}>
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
                            ) : personalFiltrado.length === 0 ? (
                                <Box textAlign="center" py={6}>
                                    <IconUsers size={56} stroke={1.5} color="#94a3b8" style={{ marginBottom: 12 }} />
                                    <Typography variant="body1" color="text.secondary" fontWeight="600">
                                        {busqueda ? 'No se encontró personal que coincida con la búsqueda.' : 'No hay personal registrado aún.'}
                                    </Typography>
                                    {esAdmin && !busqueda && (
                                        <Button 
                                            variant="contained" 
                                            startIcon={<IconUserPlus size={18} />}
                                            sx={{ mt: 2.5, borderRadius: 2, bgcolor: '#1976d2' }} 
                                            onClick={() => setTabValue(1)}
                                        >
                                            Registrar primer miembro
                                        </Button>
                                    )}
                                </Box>
                            ) : (
                                <>
                                    <DirectorioSection
                                        title="Supervisores de Operaciones"
                                        color="#7b1fa2"
                                        icon={<IconUserCheck size={22} />}
                                        users={listaSupervisores}
                                        onEdit={handleOpenEdit}
                                        onDelete={handleOpenDelete}
                                        editable={esAdmin}
                                    />
                                    <DirectorioSection
                                        title="Técnicos de Campo"
                                        color="#e65100"
                                        icon={<IconTool size={22} />}
                                        users={listaTecnicos}
                                        onEdit={handleOpenEdit}
                                        onDelete={handleOpenDelete}
                                        editable={esAdmin}
                                    />
                                </>
                            )}
                        </Box>
                    )}

                    {/* ====== TAB 1 — REGISTRAR ====== */}
                    {tabValue === 1 && esAdmin && (
                        <Box component="form" onSubmit={handleCreate} sx={{ maxWidth: 720, mx: 'auto', mt: 1 }}>
                            <Typography variant="h6" fontWeight="800" align="center" sx={{ mb: 0.5, color: '#1e293b' }}>
                                Formulario de Alta de Personal
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3.5 }}>
                                Completa la información del nuevo técnico o supervisor
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
                                        helperText="Será su usuario y contraseña provisional de acceso"
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

                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField 
                                        fullWidth 
                                        type="email" 
                                        label="Correo Electrónico" 
                                        placeholder="personal@systma.com"
                                        value={formData.email} 
                                        onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                        required 
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><IconMail size={18} color="#64748b" /></InputAdornment>
                                        }}
                                        helperText="Se enviarán las credenciales oficiales a este correo"
                                    />
                                    <TextField 
                                        select 
                                        fullWidth 
                                        label="Rol en el Sistema" 
                                        value={formData.rol} 
                                        onChange={e => setFormData({ ...formData, rol: e.target.value })} 
                                        required
                                    >
                                        <MenuItem value="Tecnico">Técnico de Campo</MenuItem>
                                        <MenuItem value="Supervisor">Supervisor de Operaciones</MenuItem>
                                    </TextField>
                                </Box>

                                <Alert 
                                    severity="info" 
                                    icon={<IconInfoCircle size={22} />}
                                    sx={{ borderRadius: 2, bgcolor: '#eff6ff', borderColor: '#bfdbfe', border: '1px solid' }}
                                >
                                    <Typography variant="body2" fontWeight="700" color="#1e40af" gutterBottom>
                                        Acceso y Seguridad del Personal:
                                    </Typography>
                                    <Typography variant="caption" color="#1e3a8a" component="div" sx={{ lineHeight: 1.6 }}>
                                        • <strong>Usuario:</strong> Número de Cédula.<br />
                                        • <strong>Contraseña inicial:</strong> Número de Cédula.<br />
                                        • <strong>Seguridad:</strong> El colaborador deberá cambiar su contraseña obligatoriamente en su primer ingreso al sistema.
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
                                            bgcolor: '#1976d2', 
                                            '&:hover': { bgcolor: '#115293' } 
                                        }}
                                    >
                                        {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Registrar Personal'}
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
                    <IconEdit size={22} color="#1976d2" /> Editar Datos del Personal
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

                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
                                select 
                                fullWidth 
                                label="Rol" 
                                value={editForm.rol} 
                                onChange={e => setEditForm({ ...editForm, rol: e.target.value })}
                            >
                                <MenuItem value="Tecnico">Técnico de Campo</MenuItem>
                                <MenuItem value="Supervisor">Supervisor de Operaciones</MenuItem>
                            </TextField>
                        </Box>

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
                        sx={{ borderRadius: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                    >
                        {editLoading ? <CircularProgress size={22} color="inherit" /> : 'Guardar Cambios'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ====== MODAL ELIMINAR ====== */}
            <Dialog open={deleteOpen} onClose={handleCloseDelete} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444' }}>
                    <IconTrash size={22} /> Eliminar Personal
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#334155', fontWeight: 500 }}>
                        ¿Estás seguro de que deseas eliminar al usuario <strong>{deleteUser?.first_name} {deleteUser?.last_name}</strong> (C.I. {deleteUser?.cedula || deleteUser?.username})?
                    </DialogContentText>
                    
                    {deleteInfo.loading && (
                        <Box display="flex" justifyContent="center" mt={2.5}><CircularProgress size={24} /></Box>
                    )}
                    
                    {!deleteInfo.loading && deleteInfo.ordenes.length > 0 && (
                        <Alert 
                            severity="warning" 
                            icon={<IconAlertTriangle size={22} />} 
                            sx={{ mt: 2.5, borderRadius: 2 }}
                        >
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Tiene {deleteInfo.ordenes.length} orden{deleteInfo.ordenes.length !== 1 ? 'es' : ''} asignada{deleteInfo.ordenes.length !== 1 ? 's' : ''}.
                            </Typography>
                            <Typography variant="caption" component="div">
                                Las órdenes pasarán a quedar <strong>sin {deleteUser?.rol_visual === 'Tecnico' ? 'técnico asignado' : 'supervisor'}</strong>, pero no se eliminarán.
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