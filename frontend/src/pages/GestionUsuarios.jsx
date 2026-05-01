import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, TextField, Button, Typography, Paper,
    MenuItem, Alert, Tabs, Tab, Box, Card, CardContent,
    Avatar, Chip, CircularProgress, IconButton, Divider, Stack,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Snackbar, Tooltip, InputAdornment, Badge
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import BuildIcon from '@mui/icons-material/Build';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ROL_CONFIG = {
    Supervisor: { color: '#7b1fa2', icon: <SupervisorAccountIcon />, chipColor: 'secondary', label: 'Supervisor' },
    Tecnico:    { color: '#e65100', icon: <BuildIcon />,             chipColor: 'warning',   label: 'Técnico' },
};

// ---------- TARJETA DE USUARIO ----------
function UserCard({ user, onEdit, onDelete, editable = true }) {
    const cfg = ROL_CONFIG[user.rol_visual] ?? ROL_CONFIG.Tecnico;
    const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.username?.[0]?.toUpperCase();

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 2,
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': { boxShadow: 3, borderColor: cfg.color },
            }}
        >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '14px !important' }}>
                <Avatar sx={{ width: 50, height: 50, bgcolor: cfg.color, fontWeight: 700 }}>
                    {initials || cfg.icon}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {user.first_name} {user.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>@{user.username}</Typography>
                    {user.email && (
                        <Typography
                            variant="caption" noWrap display="block"
                            component="a" href={`mailto:${user.email}`}
                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                            {user.email}
                        </Typography>
                    )}
                    <Chip label={cfg.label} size="small" color={cfg.chipColor} variant="outlined" sx={{ mt: 0.5 }} />
                </Box>

                {editable ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Tooltip title="Editar">
                            <IconButton size="small" color="primary" onClick={() => onEdit(user)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => onDelete(user)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ) : (
                    <Tooltip title="Solo lectura">
                        <VisibilityOffIcon fontSize="small" sx={{ color: 'text.disabled', mr: 1 }} />
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
            <Typography variant="subtitle1" sx={{ color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {icon} {title} ({users.length})
            </Typography>
            <Divider sx={{ mb: 2, bgcolor: color, height: 2, opacity: 0.25 }} />
            {users.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 2 }}>
                    {users.map(u => (
                        <UserCard key={u.id} user={u} onEdit={onEdit} onDelete={onDelete} editable={editable} />
                    ))}
                </Box>
            ) : (
                <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                    No hay usuarios en esta categoría.
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

    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
    const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

    // Modal editar
    const [editOpen, setEditOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', first_name: '', last_name: '', email: '', password: '', rol: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Modal eliminar
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteUser, setDeleteUser] = useState(null);
    const [deleteInfo, setDeleteInfo] = useState({ loading: false, ordenes: [] });
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Formulario creación
    const [formData, setFormData] = useState({ username: '', first_name: '', last_name: '', email: '', password: '', rol: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // ---------- CARGA ----------
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
    }, [cargarPersonal]);

    const listaSupervisores = personal.filter(p => p.rol_visual === 'Supervisor');
    const listaTecnicos     = personal.filter(p => p.rol_visual === 'Tecnico');

    // ---------- EDICIÓN (solo Admin) ----------
    const handleOpenEdit = (user) => {
        setEditUser(user);
        setEditForm({
            username: user.username,
            first_name: user.first_name ?? '',
            last_name: user.last_name ?? '',
            email: user.email ?? '',
            password: '',
            rol: user.rol_visual ?? '',
        });
        setEditError('');
        setEditOpen(true);
    };
    const handleCloseEdit = () => { setEditOpen(false); setEditUser(null); };

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
            showSnack(`Usuario "${editForm.username}" actualizado correctamente.`);
        } catch (err) {
            const detail = err.response?.data;
            if (typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                setEditError(msgs);
            } else {
                setEditError('Error al actualizar el usuario.');
            }
        } finally {
            setEditLoading(false);
        }
    };

    // ---------- ELIMINACIÓN (solo Admin) ----------
    const handleOpenDelete = async (user) => {
        if (user.id === loggedUserId) { showSnack('No puedes eliminarte a ti mismo.', 'warning'); return; }
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
    const handleCloseDelete = () => { setDeleteOpen(false); setDeleteUser(null); };

    const handleConfirmDelete = async () => {
        setDeleteLoading(true);
        try {
            await api.delete(`crear-usuario/${deleteUser.id}/`);
            await cargarPersonal();
            handleCloseDelete();
            showSnack(`Usuario "${deleteUser.username}" eliminado.`, 'info');
        } catch {
            showSnack('Error al eliminar el usuario.', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ---------- CREACIÓN (solo Admin) ----------
    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError('');
        try {
            await api.post('crear-usuario/', formData);
            setFormData({ username: '', first_name: '', last_name: '', email: '', password: '', rol: '' });
            await cargarPersonal();
            setTabValue(0);
            showSnack('Personal registrado exitosamente.');
        } catch (err) {
            const detail = err.response?.data;
            if (typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                setCreateError(msgs);
            } else {
                setCreateError('Error al registrar el usuario.');
            }
        } finally {
            setCreateLoading(false);
        }
    };

    // Tabs disponibles: solo Admin tiene la pestaña de "Registrar"
    const tabs = esAdmin
        ? [{ label: 'Directorio', icon: <GroupIcon /> }, { label: 'Registrar Personal', icon: <PersonAddIcon /> }]
        : [{ label: 'Directorio', icon: <GroupIcon /> }];

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>

                {/* CABECERA */}
                <Box sx={{ bgcolor: '#1976d2', p: 3, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">Gestión de Personal</Typography>
                        <Typography variant="body2">
                            {esAdmin ? 'Administra técnicos y supervisores del sistema' : 'Directorio del personal del sistema'}
                        </Typography>
                    </Box>
                    {!esAdmin && (
                        <Chip
                            label="Solo lectura"
                            size="small"
                            icon={<VisibilityOffIcon />}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.5)', border: '1px solid' }}
                        />
                    )}
                </Box>

                {/* TABS */}
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {tabs.map((t, i) => (
                        <Tab key={i} icon={t.icon} label={t.label} iconPosition="start" />
                    ))}
                </Tabs>

                <Box sx={{ p: { xs: 2, sm: 4 } }}>

                    {/* ====== TAB 0 — DIRECTORIO ====== */}
                    {tabValue === 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Directorio de Personal
                                    {!esAdmin && (
                                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                            (vista de solo lectura)
                                        </Typography>
                                    )}
                                </Typography>
                                <Tooltip title="Recargar">
                                    <IconButton onClick={cargarPersonal} color="primary"><RefreshIcon /></IconButton>
                                </Tooltip>
                            </Box>

                            {loading ? (
                                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                            ) : (
                                <>
                                    <DirectorioSection
                                        title="Supervisores" color="#7b1fa2"
                                        icon={<SupervisorAccountIcon fontSize="small" />}
                                        users={listaSupervisores}
                                        onEdit={handleOpenEdit} onDelete={handleOpenDelete}
                                        editable={esAdmin}
                                    />
                                    <DirectorioSection
                                        title="Técnicos" color="#e65100"
                                        icon={<BuildIcon fontSize="small" />}
                                        users={listaTecnicos}
                                        onEdit={handleOpenEdit} onDelete={handleOpenDelete}
                                        editable={esAdmin}
                                    />
                                </>
                            )}
                        </Box>
                    )}

                    {/* ====== TAB 1 — REGISTRAR (solo Admin) ====== */}
                    {tabValue === 1 && esAdmin && (
                        <Box component="form" onSubmit={handleCreate} sx={{ maxWidth: 700, mx: 'auto', mt: 2 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom align="center" sx={{ mb: 3 }}>
                                Datos del Nuevo Personal
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
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField
                                        fullWidth type="password" label="Contraseña" value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })} required
                                        InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment> }}
                                    />
                                    <TextField
                                        select fullWidth label="Rol Asignado" value={formData.rol}
                                        onChange={e => setFormData({ ...formData, rol: e.target.value })} required
                                    >
                                        <MenuItem value="Tecnico"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BuildIcon color="warning" fontSize="small" /> Técnico</Box></MenuItem>
                                        <MenuItem value="Supervisor"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SupervisorAccountIcon color="secondary" fontSize="small" /> Supervisor</Box></MenuItem>
                                    </TextField>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Button type="submit" variant="contained" size="large" disabled={createLoading}
                                        sx={{ minWidth: 280, borderRadius: 2, fontSize: '1rem', fontWeight: 'bold' }}>
                                        {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Guardar Personal'}
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* ====== MODAL EDITAR ====== */}
            <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight="bold">✏️ Editar Personal</DialogTitle>
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
                        <TextField select fullWidth label="Rol" value={editForm.rol} onChange={e => setEditForm({ ...editForm, rol: e.target.value })}>
                            <MenuItem value="Tecnico"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BuildIcon color="warning" fontSize="small" /> Técnico</Box></MenuItem>
                            <MenuItem value="Supervisor"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SupervisorAccountIcon color="secondary" fontSize="small" /> Supervisor</Box></MenuItem>
                        </TextField>
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
                    <DeleteIcon color="error" /> Eliminar Personal
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Eliminar a <strong>@{deleteUser?.username}</strong> ({deleteUser?.rol_visual})?
                    </DialogContentText>
                    {deleteInfo.loading && <Box display="flex" justifyContent="center" mt={2}><CircularProgress size={24} /></Box>}
                    {!deleteInfo.loading && deleteInfo.ordenes.length > 0 && (
                        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                ⚠️ Tiene {deleteInfo.ordenes.length} orden{deleteInfo.ordenes.length !== 1 ? 'es' : ''} asignada{deleteInfo.ordenes.length !== 1 ? 's' : ''}.
                            </Typography>
                            <Typography variant="caption">
                                Las órdenes no se eliminarán, pero perderán la asignación de este {deleteUser?.rol_visual?.toLowerCase()}.
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