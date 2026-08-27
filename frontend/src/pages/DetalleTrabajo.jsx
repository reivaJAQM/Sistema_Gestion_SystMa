import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, TextField, Button, Divider,
    List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Alert, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton,
    MenuItem, FormControl, Select, InputLabel, Stack
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SendIcon from '@mui/icons-material/Send';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import EngineeringIcon from '@mui/icons-material/Engineering';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

import api from '../services/api';

// --- LEAFLET ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DetalleTrabajo() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [orden, setOrden] = useState(null);
    const [estados, setEstados] = useState([]);
    const [avances, setAvances] = useState([]);
    const [nuevoTexto, setNuevoTexto] = useState('');
    const [nuevasFotos, setNuevasFotos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [openRechazo, setOpenRechazo] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    // CAMBIO: Ahora usamos un índice en lugar de solo la URL
    const [photoIndex, setPhotoIndex] = useState(-1);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', subtext: '' });
    const [actionLoading, setActionLoading] = useState(false);

    // Estados para Edición y Eliminación (Administrador / Supervisor)
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [listaClientes, setListaClientes] = useState([]);
    const [listaTecnicos, setListaTecnicos] = useState([]);
    const [listaSupervisores, setListaSupervisores] = useState([]);
    const [editFormData, setEditFormData] = useState({
        titulo: '',
        descripcion: '',
        direccion: '',
        cliente: '',
        tecnico: '',
        supervisor: '',
        estado: '',
        fecha_inicio: '',
        fecha_fin: ''
    });

    const userRol = localStorage.getItem('user_rol');
    const userId = parseInt(localStorage.getItem('user_id'));

    const cargarDatos = useCallback(async () => {
        try {
            const [resOrden, resAvances, resEstados] = await Promise.all([
                api.get(`ordenes/${id}/`),
                api.get(`avances/?orden=${id}`),
                api.get('estados/')
            ]);
            // Si es cliente, verificar que la orden le pertenece
            if (userRol === 'Cliente' && resOrden.data.cliente !== userId) {
                alert("No tienes permiso para ver esta orden.");
                navigate('/mis-solicitudes');
                return;
            }
            setOrden(resOrden.data);
            setAvances(resAvances.data);
            setEstados(resEstados.data);
        } catch (error) {
            console.error("Error al cargar datos", error);
        } finally {
            setLoading(false);
        }
    }, [id, navigate, userId, userRol]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // --- LÓGICA PARA RECOLECTAR TODAS LAS IMÁGENES ---
    const getTodasLasImagenes = useCallback(() => {
        const imgs = [];
        if (orden && orden.foto_referencia) {
            imgs.push(orden.foto_referencia);
        }
        if (avances) {
            avances.forEach(av => {
                if (av.imagenes && av.imagenes.length > 0) {
                    av.imagenes.forEach(img => imgs.push(img.foto));
                } else if (av.foto) {
                    imgs.push(av.foto);
                }
            });
        }
        return imgs;
    }, [avances, orden]);

    const todasLasImagenes = getTodasLasImagenes();

    const handleOpenLightbox = (url) => {
        const idx = todasLasImagenes.findIndex(img => img === url);
        setPhotoIndex(idx !== -1 ? idx : 0);
    };

    const handleNextPhoto = useCallback(() => {
        if (photoIndex < todasLasImagenes.length - 1) {
            setPhotoIndex(prev => prev + 1);
        }
    }, [photoIndex, todasLasImagenes.length]);

    const handlePrevPhoto = useCallback(() => {
        if (photoIndex > 0) {
            setPhotoIndex(prev => prev - 1);
        }
    }, [photoIndex]);

    // --- FUNCIONES DE ADMINISTRACIÓN / EDICIÓN Y ELIMINACIÓN ---
    const handleAbrirEdicion = async () => {
        try {
            const [resClientes, resTecnicos, resSupervisores] = await Promise.all([
                api.get('clientes/'),
                api.get('tecnicos/'),
                api.get('supervisores/')
            ]);
            setListaClientes(resClientes.data);
            setListaTecnicos(resTecnicos.data);
            setListaSupervisores(resSupervisores.data);

            setEditFormData({
                titulo: orden.titulo || '',
                descripcion: orden.descripcion || '',
                direccion: orden.direccion || '',
                cliente: orden.cliente || '',
                tecnico: orden.tecnico || '',
                supervisor: orden.supervisor || '',
                estado: orden.estado || (orden.estado_data?.id || ''),
                fecha_inicio: orden.fecha_inicio ? orden.fecha_inicio.substring(0, 16) : '',
                fecha_fin: orden.fecha_fin ? orden.fecha_fin.substring(0, 16) : '',
            });
            setOpenEditModal(true);
        } catch (error) {
            console.error("Error al preparar edición", error);
            alert("Error al cargar datos para edición");
        }
    };

    const handleGuardarEdicion = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                titulo: editFormData.titulo,
                descripcion: editFormData.descripcion,
                direccion: editFormData.direccion,
                cliente: editFormData.cliente,
                tecnico: editFormData.tecnico || null,
                supervisor: editFormData.supervisor || null,
                estado: editFormData.estado || null,
                fecha_inicio: editFormData.fecha_inicio ? new Date(editFormData.fecha_inicio).toISOString() : null,
                fecha_fin: editFormData.fecha_fin ? new Date(editFormData.fecha_fin).toISOString() : null,
            };
            await api.patch(`ordenes/${id}/`, payload);
            setOpenEditModal(false);
            setSuccessMessage({
                title: "¡Orden Actualizada!",
                subtext: "Los cambios en la orden de trabajo han sido guardados correctamente."
            });
            setShowSuccessModal(true);
            cargarDatos();
        } catch (error) {
            console.error("Error al actualizar orden", error);
            alert("Error al actualizar la orden de trabajo.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEliminarOrden = async () => {
        setActionLoading(true);
        try {
            await api.delete(`ordenes/${id}/`);
            setOpenDeleteModal(false);
            navigate('/todos-los-trabajos');
        } catch (error) {
            console.error("Error al eliminar orden", error);
            alert("Error al eliminar la orden de trabajo.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEnviarAvance = async (e) => {
        e.preventDefault();
        if (!nuevoTexto && nuevasFotos.length === 0) return alert("Escribe algo o sube fotos");
        setActionLoading(true);

        const formData = new FormData();
        formData.append('orden', id);
        formData.append('contenido', nuevoTexto);

        if (nuevasFotos.length > 0) {
            nuevasFotos.forEach((foto) => {
                formData.append('fotos', foto);
            });
        }

        try {
            await api.post('avances/', formData);
            setNuevoTexto('');
            setNuevasFotos([]);
            cargarDatos();
            setSuccessMessage({
                title: "¡Avance Registrado!",
                subtext: "El avance ha sido guardado exitosamente en la bitácora."
            });
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Error enviando avance", error);
            alert("Error al guardar el avance");
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setNuevasFotos(prev => [...prev, ...filesArray]);
        }
    };

    const removerFoto = (index) => {
        setNuevasFotos(prev => prev.filter((_, i) => i !== index));
    };

    const descargarPDF = async () => {
        try {
            const response = await api.get(`ordenes/${id}/pdf/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const nombreArchivo = orden.titulo ? orden.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `orden_${id}`;
            link.setAttribute('download', `Reporte_${nombreArchivo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error descargando PDF", error);
            alert("No se pudo generar el reporte.");
        }
    };

    // --- ACCIONES DE SUPERVISOR CORREGIDAS ---

    const handleAprobar = async () => {
        if (!window.confirm("¿Confirmas que el trabajo está correcto y finalizado?")) return;
        setActionLoading(true);
        try {
            const estadoFinalizado = estados.find(e => e.nombre === 'Finalizado');

            const formData = new FormData();
            formData.append('orden', id);
            formData.append('contenido', 'TRABAJO APROBADO Y FINALIZADO POR SUPERVISIÓN.');
            await api.post('avances/', formData);

            await api.patch(`ordenes/${id}/`, {
                estado: estadoFinalizado.id,
                fecha_fin: new Date().toISOString()
            });

            setSuccessMessage({
                title: "¡Orden Finalizada!",
                subtext: "El trabajo ha sido aprobado correctamente. La orden ahora está cerrada."
            });
            setShowSuccessModal(true);
            cargarDatos();

        } catch (error) {
            console.error("Error al aprobar", error);
            alert("Ocurrió un error al intentar finalizar la orden.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRechazar = async () => {
        if (!motivoRechazo) return alert("Debes escribir el motivo del rechazo.");
        setActionLoading(true);
        try {
            const estadoProgreso = estados.find(e => e.nombre === 'En Progreso');

            const formData = new FormData();
            formData.append('orden', id);
            formData.append('contenido', `❌ RECHAZADO: ${motivoRechazo}`);
            await api.post('avances/', formData);

            await api.patch(`ordenes/${id}/`, { estado: estadoProgreso.id });

            setSuccessMessage({
                title: "Devuelto a Corrección",
                subtext: "El técnico ha sido notificado y la orden está nuevamente en progreso."
            });
            setShowSuccessModal(true);
            setOpenRechazo(false);
            cargarDatos();

        } catch (error) {
            console.error("Error al rechazar", error);
            alert("Error al rechazar el trabajo.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleTecnicoAccion = async (nuevoEstadoNombre) => {
        const nuevoEstado = estados.find(e => e.nombre === nuevoEstadoNombre);
        if (!nuevoEstado) return alert(`Error: estado ${nuevoEstadoNombre} no encontrado`);
        setActionLoading(true);

        try {
            let mensajeHistorial = '';
            let tituloModal = '';
            let cuerpoModal = '';

            if (nuevoEstadoNombre === 'En Progreso') {
                mensajeHistorial = '▶ TRABAJO INICIADO POR EL TÉCNICO';
                tituloModal = '¡Manos a la obra!';
                cuerpoModal = 'El cronómetro ha iniciado. No olvides registrar tus avances y subir evidencia.';
            } else {
                mensajeHistorial = 'REVISIÓN SOLICITADA POR EL TÉCNICO';
                tituloModal = '¡Excelente Trabajo!';
                cuerpoModal = 'Se ha notificado al supervisor. Mantente atento a la validación.';
            }

            const formData = new FormData();
            formData.append('orden', id);
            formData.append('contenido', mensajeHistorial);

            if (nuevoEstadoNombre === 'En Progreso') {
                await api.patch(`ordenes/${id}/`, { estado: nuevoEstado.id });
                await api.post('avances/', formData);
            } else {
                await api.post('avances/', formData);
                await api.patch(`ordenes/${id}/`, { estado: nuevoEstado.id });
            }

            setSuccessMessage({ title: tituloModal, subtext: cuerpoModal });
            setShowSuccessModal(true);
            cargarDatos();
        } catch (error) {
            console.error("Error cambiando estado técnico", error);
            alert("Error al actualizar el estado. Intenta nuevamente.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

    // Variables
    const lat = orden.latitud ? parseFloat(orden.latitud) : null;
    const lng = orden.longitud ? parseFloat(orden.longitud) : null;
    const tieneGPS = lat && lng;
    const esRevision = orden.estado_data?.nombre === 'En Revisión';
    const esPendiente = orden.estado_data?.nombre === 'Pendiente';
    const esEnProgreso = orden.estado_data?.nombre === 'En Progreso';
    const esFinalizado = orden.estado_data?.nombre === 'Finalizado';
    const esSupervisorOAdmin = userRol === 'Administrador' || (userRol === 'Supervisor' && orden.supervisor === userId);
    const esTecnicoAsignado = userRol === 'Tecnico' && orden.tecnico === userId;
    const mostrarBotonPDF = userRol === 'Administrador' || ((esSupervisorOAdmin || userRol === 'Cliente') && esFinalizado);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ fontWeight: 'bold' }}>Volver</Button>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {esSupervisorOAdmin && (
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={handleAbrirEdicion}
                            disabled={actionLoading}
                        >
                            Editar Orden
                        </Button>
                    )}

                    {userRol === 'Administrador' && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => setOpenDeleteModal(true)}
                            disabled={actionLoading}
                        >
                            Eliminar Orden
                        </Button>
                    )}

                    {mostrarBotonPDF && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={descargarPDF}
                        >
                            Descargar Reporte PDF
                        </Button>
                    )}
                </Box>
            </Box>

            {/* PANEL TÉCNICO */}
            {esTecnicoAsignado && !esRevision && orden.estado_data?.nombre !== 'Finalizado' && (
                <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#e3f2fd', border: '2px dashed #1976d2' }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <EngineeringIcon color="primary" fontSize="large" />
                        <Box>
                            <Typography variant="h6" fontWeight="bold" color="primary">Panel de Ejecución</Typography>
                            <Typography variant="body2">{esPendiente ? "Estás listo para comenzar? Marca el inicio aquí." : "Cuando termines, solicita la revisión."}</Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {esPendiente && (
                        <Button variant="contained" color="success" fullWidth size="large" onClick={() => handleTecnicoAccion('En Progreso')} disabled={actionLoading} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {actionLoading ? <CircularProgress size={24} color="inherit" /> : "Iniciar Trabajo"}
                        </Button>
                    )}
                    {esEnProgreso && (
                        <Button variant="contained" color="warning" fullWidth size="large" startIcon={<AssignmentTurnedInIcon />} onClick={() => handleTecnicoAccion('En Revisión')} disabled={actionLoading} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {actionLoading ? <CircularProgress size={24} color="inherit" /> : "Finalizar y Solicitar Revisión"}
                        </Button>
                    )}
                </Paper>
            )}

            {esTecnicoAsignado && esRevision && (
                <Alert severity="warning" sx={{ mb: 4 }} icon={<SupervisorAccountIcon fontSize="inherit" />}><strong>Trabajo en Revisión:</strong> Esperando que el Supervisor apruebe o rechace tu trabajo.</Alert>
            )}

            {userRol === 'Cliente' && esRevision && (
                <Alert severity="info" sx={{ mb: 4 }} icon={<SupervisorAccountIcon fontSize="inherit" />}><strong>Trabajo en Revisión:</strong> Tu solicitud está siendo evaluada por nuestro equipo de supervisión.</Alert>
            )}

            {esSupervisorOAdmin && esRevision && (
                <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#fff3e0', border: '2px dashed #ed6c02' }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <SupervisorAccountIcon color="warning" fontSize="large" />
                        <Box><Typography variant="h6" fontWeight="bold">Revisión Requerida</Typography><Typography variant="body2">El técnico ha marcado este trabajo como terminado.</Typography></Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box display="flex" gap={2} justifyContent="flex-end">
                        <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setOpenRechazo(true)} disabled={actionLoading}>Rechazar</Button>
                        <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={handleAprobar} disabled={actionLoading}>
                            {actionLoading ? <CircularProgress size={24} color="inherit" /> : "Aprobar"}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* ENCABEZADO ORDEN */}
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderLeft: `6px solid ${orden.estado_data?.color || '#1976d2'}` }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h5" fontWeight="bold" gutterBottom>{orden.titulo}</Typography>
                    <Chip label={orden.estado_data?.nombre} sx={{ bgcolor: orden.estado_data?.color, color: 'white', fontWeight: 'bold' }} />
                </Box>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1"><strong>Cliente:</strong> {orden.cliente_nombre}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Técnico Asignado:</strong> {orden.tecnico_nombre || "No asignado"}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Supervisor:</strong> {orden.supervisor_nombre || "No asignado"}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Dirección:</strong> {orden.direccion || "Sin dirección"}</Typography>
                        <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">DESCRIPCIÓN:</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>{orden.descripcion}</Typography>
                        </Box>
                    </Grid>
                    {orden.foto_referencia && (
                        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <img
                                src={orden.foto_referencia}
                                alt="Fachada"
                                style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
                                onClick={() => handleOpenLightbox(orden.foto_referencia)} // ABRIR LIGHTBOX
                            />
                        </Grid>
                    )}
                </Grid>
                {tieneGPS && (
                    <Box sx={{ mt: 3 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocationOnIcon color="error" fontSize="small" /> Ubicación GPS</Typography>
                            <Button variant="outlined" size="small" startIcon={<MapIcon />} href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank">Navegar</Button>
                        </Box>
                        <Box sx={{ height: '250px', width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #ccc' }}>
                            <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[lat, lng]}><Popup>Aquí es el trabajo</Popup></Marker>
                            </MapContainer>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* FORMULARIO BITÁCORA */}
            {userRol !== 'Cliente' && !esPendiente && !esRevision && orden.estado_data?.nombre !== 'Finalizado' && (
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>📝 Bitácora de Avances</Typography>
                    <Box component="form" onSubmit={handleEnviarAvance}>
                        <TextField
                            placeholder="Escribe aquí los detalles del trabajo..."
                            multiline rows={3} fullWidth
                            value={nuevoTexto} onChange={(e) => setNuevoTexto(e.target.value)}
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    minHeight: '120px',
                                    alignItems: 'flex-start',
                                    padding: '8px'
                                },
                                '& .MuiInputBase-input': {
                                    padding: '12px !important'
                                }
                            }}
                        />
                        {nuevasFotos.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', py: 1 }}>
                                {nuevasFotos.map((file, index) => (
                                    <Box key={index} sx={{ position: 'relative', flexShrink: 0 }}>
                                        <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
                                        <IconButton size="small" onClick={() => removerFoto(index)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button variant={nuevasFotos.length > 0 ? "contained" : "outlined"} component="label" color={nuevasFotos.length > 0 ? "success" : "primary"} startIcon={<PhotoCamera />}>
                                {nuevasFotos.length > 0 ? `Subir ${nuevasFotos.length} Fotos` : "Subir Evidencia"}
                                <input type="file" hidden accept="image/*" multiple onChange={handleFileChange} />
                            </Button>
                            <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={actionLoading}>
                                {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Guardar Avance"}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* HISTORIAL */}
            {(userRol === 'Cliente' || !esPendiente) && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Historial de Actividad</Typography>
                    {avances.length === 0 ? (
                        <Alert severity="info">Sin registros aún.</Alert>
                    ) : (
                        <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                            {avances.map((avance) => (
                                <React.Fragment key={avance.id}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar><Avatar sx={{ bgcolor: '#1976d2' }}><AssignmentIcon /></Avatar></ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Typography component="span" variant="subtitle2" color="text.primary" sx={{ fontWeight: 'bold' }}>
                                                        {avance.usuario_nombre_completo || avance.usuario_nombre || 'Sistema'}
                                                    </Typography>
                                                    <Typography component="span" variant="caption" color="text.secondary">
                                                        {new Date(avance.creado_en).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                                    <Typography component="span" variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>{avance.contenido}</Typography>
                                                    {/* FOTOS AGRUPADAS */}
                                                    {avance.imagenes && avance.imagenes.length > 0 && (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                                            {avance.imagenes.map((imgItem) => (
                                                                <Box
                                                                    key={imgItem.id}
                                                                    component="img"
                                                                    src={imgItem.foto}
                                                                    alt="Evidencia"
                                                                    sx={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 2, border: '1px solid #ddd', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'scale(1.05)' } }}
                                                                    onClick={() => handleOpenLightbox(imgItem.foto)} // ABRIR LIGHTBOX
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                    {/* LEGACY FOTO */}
                                                    {(!avance.imagenes || avance.imagenes.length === 0) && avance.foto && (
                                                        <Box
                                                            component="img"
                                                            src={avance.foto}
                                                            sx={{ maxWidth: '200px', borderRadius: 1, mt: 1, cursor: 'pointer' }}
                                                            onClick={() => handleOpenLightbox(avance.foto)} // ABRIR LIGHTBOX
                                                        />
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>
            )}

            {/* MODAL RECHAZO */}
            <Dialog open={openRechazo} onClose={() => setOpenRechazo(false)}>
                <DialogTitle>Devolver a Corrección</DialogTitle>
                <DialogContent sx={{ minWidth: 400 }}>
                    <Typography variant="body2" gutterBottom>Explica al técnico qué debe corregir.</Typography>
                    <TextField autoFocus margin="dense" placeholder="Escribe una retroalimentación" fullWidth multiline rows={3} value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRechazo(false)}>Cancelar</Button>
                    <Button onClick={handleRechazar} variant="contained" color="error" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirmar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL LIGHTBOX MEJORADO CON FLECHAS */}
            <Dialog
                open={photoIndex !== -1}
                onClose={() => setPhotoIndex(-1)}
                maxWidth="lg"
                PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}
            >
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', outline: 'none' }}>

                    {/* Botón Prev */}
                    {photoIndex > 0 && (
                        <IconButton
                            onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
                            sx={{ position: 'absolute', left: -20, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, zIndex: 10 }}
                        >
                            <ArrowBackIosNewIcon fontSize="large" />
                        </IconButton>
                    )}

                    <img
                        src={todasLasImagenes[photoIndex]}
                        alt="Zoom"
                        style={{ maxHeight: '90vh', maxWidth: '100%', objectFit: 'contain' }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Botón Next */}
                    {photoIndex < todasLasImagenes.length - 1 && (
                        <IconButton
                            onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
                            sx={{ position: 'absolute', right: -20, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, zIndex: 10 }}
                        >
                            <ArrowForwardIosIcon fontSize="large" />
                        </IconButton>
                    )}
                </Box>
            </Dialog>

            {/* MODAL ÉXITO */}
            <Dialog open={showSuccessModal} onClose={() => setShowSuccessModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, textAlign: 'center', p: 2 } }}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80 }} />
                    <Typography variant="h5" fontWeight="bold" color="text.primary">{successMessage.title}</Typography>
                    <Typography variant="body1" color="text.secondary">{successMessage.subtext}</Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button variant="contained" color="success" size="large" onClick={() => setShowSuccessModal(false)} sx={{ minWidth: 120, borderRadius: 2 }}>Entendido</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL ELIMINAR ORDEN (SOLO ADMIN) */}
            <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 'bold' }}>
                    <DeleteIcon /> ¿Eliminar Orden de Trabajo?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="text.primary" gutterBottom>
                        Esta acción eliminará de forma permanente la orden <strong>"{orden?.titulo}"</strong>, junto con todas sus fotos y registros de la bitácora.
                    </Typography>
                    <Alert severity="error" sx={{ mt: 2 }}>
                        Esta operación no se puede deshacer.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDeleteModal(false)} color="inherit">Cancelar</Button>
                    <Button
                        onClick={handleEliminarOrden}
                        variant="contained"
                        color="error"
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Sí, Eliminar Definitivamente"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL EDITAR ORDEN (ADMIN / SUPERVISOR) */}
            <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    ✏️ Editar Orden de Trabajo #{orden?.id}
                </DialogTitle>
                <Box component="form" onSubmit={handleGuardarEdicion}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Título del Trabajo"
                            fullWidth
                            required
                            value={editFormData.titulo}
                            onChange={(e) => setEditFormData({ ...editFormData, titulo: e.target.value })}
                        />

                        <TextField
                            label="Descripción / Requerimiento"
                            fullWidth
                            multiline
                            rows={3}
                            value={editFormData.descripcion}
                            onChange={(e) => setEditFormData({ ...editFormData, descripcion: e.target.value })}
                        />

                        <TextField
                            label="Dirección"
                            fullWidth
                            value={editFormData.direccion}
                            onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Cliente</InputLabel>
                            <Select
                                value={editFormData.cliente}
                                label="Cliente"
                                onChange={(e) => setEditFormData({ ...editFormData, cliente: e.target.value })}
                            >
                                {listaClientes.map(c => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.first_name || c.last_name ? `${c.first_name} ${c.last_name} (${c.username})` : c.username}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Técnico Asignado</InputLabel>
                            <Select
                                value={editFormData.tecnico}
                                label="Técnico Asignado"
                                onChange={(e) => setEditFormData({ ...editFormData, tecnico: e.target.value })}
                            >
                                <MenuItem value=""><em>Sin Asignar</em></MenuItem>
                                {listaTecnicos.map(t => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.first_name || t.last_name ? `${t.first_name} ${t.last_name} (${t.username})` : t.username}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {userRol === 'Administrador' && (
                            <FormControl fullWidth>
                                <InputLabel>Supervisor Asignado</InputLabel>
                                <Select
                                    value={editFormData.supervisor}
                                    label="Supervisor Asignado"
                                    onChange={(e) => setEditFormData({ ...editFormData, supervisor: e.target.value })}
                                >
                                    <MenuItem value=""><em>Sin Asignar</em></MenuItem>
                                    {listaSupervisores.map(s => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.first_name || s.last_name ? `${s.first_name} ${s.last_name} (${s.username})` : s.username}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <FormControl fullWidth>
                            <InputLabel>Estado Actual</InputLabel>
                            <Select
                                value={editFormData.estado}
                                label="Estado Actual"
                                onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value })}
                            >
                                {estados.map(est => (
                                    <MenuItem key={est.id} value={est.id}>
                                        {est.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Fecha / Hora de Inicio"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={editFormData.fecha_inicio}
                            onChange={(e) => setEditFormData({ ...editFormData, fecha_inicio: e.target.value })}
                        />

                        <TextField
                            label="Fecha / Hora de Finalización"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={editFormData.fecha_fin}
                            onChange={(e) => setEditFormData({ ...editFormData, fecha_fin: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenEditModal(false)} color="inherit">Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={actionLoading}>
                            {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Guardar Cambios"}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

        </Container>
    );
}