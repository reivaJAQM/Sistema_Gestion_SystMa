import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, TextField, Button, Divider,
    List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Alert, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton,
    MenuItem, FormControl, Select, InputLabel, Stack, Collapse,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent
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
import HandymanIcon from '@mui/icons-material/Handyman';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';

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

    // Estados para Inventario (Herramientas y Materiales)
    const [herramientasAsignadas, setHerramientasAsignadas] = useState([]);
    const [materialesUsados, setMaterialesUsados] = useState([]);

    // Modales de Inventario
    const [openModalConsumo, setOpenModalConsumo] = useState(false);
    const [materialSeleccionadoConsumo, setMaterialSeleccionadoConsumo] = useState(null);
    const [cantidadConsumoInput, setCantidadConsumoInput] = useState('');

    const [loading, setLoading] = useState(true);
    const [detallesExpandidos, setDetallesExpandidos] = useState(false);
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

    // Estados para Solicitud de Insumos Adicionales
    const [solicitudesInsumos, setSolicitudesInsumos] = useState([]);
    const [openModalSolicitarInsumo, setOpenModalSolicitarInsumo] = useState(false);
    const [tipoInsumo, setTipoInsumo] = useState('MATERIAL');
    const [itemInsumoSeleccionado, setItemInsumoSeleccionado] = useState('');
    const [cantidadInsumoSolicitada, setCantidadInsumoSolicitada] = useState(1);
    const [motivoInsumoSolicitado, setMotivoInsumoSolicitado] = useState('');
    const [inventarioItems, setInventarioItems] = useState([]);
    const [submittingInsumo, setSubmittingInsumo] = useState(false);
    const [openModalRechazarInsumo, setOpenModalRechazarInsumo] = useState(false);
    const [solicitudARechazar, setSolicitudARechazar] = useState(null);
    const [motivoRechazoInsumo, setMotivoRechazoInsumo] = useState('');

    const userRol = localStorage.getItem('user_rol');
    const [currentUserId, setCurrentUserId] = useState(() => {
        const stored = parseInt(localStorage.getItem('user_id'));
        return isNaN(stored) ? null : stored;
    });

    const cargarDatos = useCallback(async () => {
        try {
            if (!currentUserId || isNaN(currentUserId)) {
                try {
                    const perfilRes = await api.get('perfil/');
                    if (perfilRes.data.id || perfilRes.data.user_id) {
                        const uid = perfilRes.data.id || perfilRes.data.user_id;
                        setCurrentUserId(uid);
                        localStorage.setItem('user_id', uid);
                    }
                } catch (e) {
                    console.error("Error al obtener perfil", e);
                }
            }

            const [resOrden, resAvances, resEstados, resHerramientas, resMateriales, resSolicitudes] = await Promise.all([
                api.get(`ordenes/${id}/`),
                api.get(`avances/?orden=${id}`),
                api.get('estados/'),
                api.get(`orden-herramientas/?orden=${id}`),
                api.get(`orden-materiales/?orden=${id}`),
                api.get(`solicitudes-insumos/?orden=${id}`).catch(() => ({ data: [] }))
            ]);
            setOrden(resOrden.data);
            setAvances(resAvances.data || []);
            setEstados(resEstados.data || []);
            setHerramientasAsignadas(resHerramientas.data || resOrden.data.herramientas_asignadas || []);
            setMaterialesUsados(resMateriales.data || resOrden.data.materiales_usados || []);
            setSolicitudesInsumos(resSolicitudes.data || resOrden.data.solicitudes_insumos || []);
        } catch (error) {
            console.error("Error al cargar datos", error);
            try {
                const resOrden = await api.get(`ordenes/${id}/`);
                setOrden(resOrden.data);
                if (resOrden.data.herramientas_asignadas) setHerramientasAsignadas(resOrden.data.herramientas_asignadas);
                if (resOrden.data.materiales_usados) setMaterialesUsados(resOrden.data.materiales_usados);
                if (resOrden.data.solicitudes_insumos) setSolicitudesInsumos(resOrden.data.solicitudes_insumos);
            } catch (err2) {
                console.error("Error definitivo cargando orden:", err2);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

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

    // --- HANDLERS DE GESTIÓN DE INVENTARIO Y HERRAMIENTAS ---
    const handleDevolverHerramienta = async (asigId, herramientaNombre) => {
        if (!window.confirm(`¿Confirmar que la herramienta "${herramientaNombre}" fue devuelta al almacén?`)) return;
        setActionLoading(true);
        try {
            await api.post(`orden-herramientas/${asigId}/marcar-devolucion/`, {});
            cargarDatos();
        } catch (error) {
            console.error("Error al devolver herramienta", error);
            alert("Error al registrar la devolución de la herramienta.");
        } finally {
            setActionLoading(false);
        }
    };

    const [openModalChecklist, setOpenModalChecklist] = useState(false);
    const [checklistMateriales, setChecklistMateriales] = useState({});

    const handleConsumirTodo = async (uso) => {
        setActionLoading(true);
        const cantEntera = Math.round(Number(uso.cantidad_estimada)) || 0;
        try {
            await api.post(`orden-materiales/${uso.id}/registrar-consumo/`, {
                cantidad_real: cantEntera
            });
            cargarDatos();
        } catch (error) {
            console.error("Error registrando consumo total:", error);
            alert("No se pudo registrar el consumo.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAbrirModalConsumo = (uso) => {
        setMaterialSeleccionadoConsumo(uso);
        const cr = Number(uso.cantidad_real);
        const ce = Number(uso.cantidad_estimada);
        const valor = cr > 0 ? cr : ce;
        setCantidadConsumoInput(Math.round(valor) || 0);
        setOpenModalConsumo(true);
    };

    const handleGuardarConsumo = async (e) => {
        e.preventDefault();
        if (cantidadConsumoInput === '' || Number(cantidadConsumoInput) < 0) {
            return alert("Ingresa una cantidad válida.");
        }
        setActionLoading(true);
        try {
            await api.post(`orden-materiales/${materialSeleccionadoConsumo.id}/registrar-consumo/`, {
                cantidad_real: Math.round(Number(cantidadConsumoInput))
            });
            setOpenModalConsumo(false);
            cargarDatos();
        } catch (error) {
            console.error("Error al registrar consumo", error);
            alert("Error al registrar el consumo del material.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEliminarMaterialUso = async (usoId) => {
        if (!window.confirm("¿Eliminar este material de la orden?")) return;
        setActionLoading(true);
        try {
            await api.delete(`orden-materiales/${usoId}/`);
            cargarDatos();
        } catch (error) {
            console.error("Error al eliminar material", error);
            alert("Error al eliminar material.");
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
            formData.append('contenido', `RECHAZADO: ${motivoRechazo}`);
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

    const ejecutarCambioEstadoTecnico = async (nuevoEstadoNombre) => {
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

    const handleAbrirChecklistFinalizar = () => {
        const inicial = {};
        materialesUsados.forEach(m => {
            const cr = Number(m.cantidad_real);
            inicial[m.id] = cr > 0 ? m.cantidad_real : (Number(m.cantidad_estimada) || 0);
        });
        setChecklistMateriales(inicial);
        setOpenModalChecklist(true);
    };

    const handleConfirmarChecklist = async () => {
        setActionLoading(true);
        try {
            const promesas = Object.entries(checklistMateriales).map(([usoId, cant]) => {
                return api.post(`orden-materiales/${usoId}/registrar-consumo/`, {
                    cantidad_real: cant
                });
            });
            await Promise.all(promesas);
            setOpenModalChecklist(false);
            await ejecutarCambioEstadoTecnico('En Revisión');
        } catch (err) {
            console.error('Error guardando checklist de materiales:', err);
            alert('Error al guardar el consumo de materiales. Intenta nuevamente.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTecnicoAccion = async (nuevoEstadoNombre) => {
        if (nuevoEstadoNombre === 'En Revisión' && materialesUsados.length > 0) {
            handleAbrirChecklistFinalizar();
        } else {
            await ejecutarCambioEstadoTecnico(nuevoEstadoNombre);
        }
    };

    // --- FUNCIONES DE SOLICITUD DE INSUMOS ADICIONALES ---
    const handleAbrirModalSolicitarInsumo = async () => {
        try {
            const { data } = await api.get('inventario/?activo=true');
            setInventarioItems(data || []);
        } catch (e) {
            console.error("Error cargando inventario", e);
        }
        setTipoInsumo('MATERIAL');
        setItemInsumoSeleccionado('');
        setCantidadInsumoSolicitada(1);
        setMotivoInsumoSolicitado('');
        setOpenModalSolicitarInsumo(true);
    };

    const handleEnviarSolicitudInsumo = async (e) => {
        e.preventDefault();
        if (!itemInsumoSeleccionado) {
            alert("Por favor selecciona un ítem del inventario.");
            return;
        }
        if (!motivoInsumoSolicitado.trim()) {
            alert("Por favor escribe una justificación o motivo para la solicitud.");
            return;
        }
        setSubmittingInsumo(true);
        try {
            await api.post('solicitudes-insumos/', {
                orden: id,
                item: itemInsumoSeleccionado,
                tipo_item: tipoInsumo,
                cantidad: parseInt(cantidadInsumoSolicitada) || 1,
                motivo: motivoInsumoSolicitado.trim()
            });
            setOpenModalSolicitarInsumo(false);
            setSuccessMessage({
                title: "¡Solicitud Enviada con Éxito!",
                subtext: "Se notificó al administrador y supervisor asignado para su aprobación y despacho."
            });
            setShowSuccessModal(true);
            cargarDatos();
        } catch (err) {
            console.error("Error enviando solicitud de insumo", err);
            alert(err.response?.data?.detail || "Error al enviar la solicitud.");
        } finally {
            setSubmittingInsumo(false);
        }
    };

    const handleAprobarSolicitudInsumo = async (solicitudId) => {
        if (!window.confirm("¿Confirmas que deseas aprobar y despachar este insumo para la orden? Se descontará del stock de almacén.")) return;
        setActionLoading(true);
        try {
            await api.post(`solicitudes-insumos/${solicitudId}/aprobar/`);
            setSuccessMessage({
                title: "¡Insumo Aprobado y Despachado!",
                subtext: "El insumo ha sido asignado a la orden del técnico y el stock fue actualizado."
            });
            setShowSuccessModal(true);
            cargarDatos();
        } catch (err) {
            console.error("Error aprobando insumo", err);
            alert(err.response?.data?.detail || "Error al aprobar la solicitud.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAbrirRechazoInsumo = (solicitud) => {
        setSolicitudARechazar(solicitud);
        setMotivoRechazoInsumo('');
        setOpenModalRechazarInsumo(true);
    };

    const handleConfirmarRechazoInsumo = async () => {
        if (!solicitudARechazar) return;
        setActionLoading(true);
        try {
            await api.post(`solicitudes-insumos/${solicitudARechazar.id}/rechazar/`, {
                motivo: motivoRechazoInsumo.trim()
            });
            setOpenModalRechazarInsumo(false);
            setSuccessMessage({
                title: "Solicitud Rechazada",
                subtext: "Se ha registrado la notificación al técnico en la orden."
            });
            setShowSuccessModal(true);
            cargarDatos();
        } catch (err) {
            console.error("Error rechazando solicitud", err);
            alert(err.response?.data?.detail || "Error al procesar el rechazo.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!orden) {
        return (
            <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}>
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    No se encontró la orden de trabajo o no tienes permisos para acceder a este registro.
                </Alert>
                <Button variant="contained" onClick={() => navigate(-1)} sx={{ fontWeight: 700 }}>
                    Volver
                </Button>
            </Container>
        );
    }

    // Variables
    const lat = orden.latitud ? parseFloat(orden.latitud) : null;
    const lng = orden.longitud ? parseFloat(orden.longitud) : null;
    const tieneGPS = lat && lng;
    const esRevision = orden.estado_data?.nombre === 'En Revisión';
    const esPendiente = orden.estado_data?.nombre === 'Pendiente';
    const esEnProgreso = orden.estado_data?.nombre === 'En Progreso';
    const esFinalizado = orden.estado_data?.nombre === 'Finalizado';
    const esSupervisorAsignado = userRol === 'Supervisor' && Number(orden.supervisor) === Number(currentUserId);
    const esSupervisorOAdmin = userRol === 'Administrador' || esSupervisorAsignado;
    const esTecnico = userRol === 'Tecnico';
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

            {/* PANEL DE EJECUCIÓN TÉCNICO (EXCLUSIVO DEL TÉCNICO ASIGNADO) */}
            {esTecnico && !esRevision && !esFinalizado && (
                <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: esPendiente ? '#ecfdf5' : '#eff6ff', border: `2px solid ${esPendiente ? '#10b981' : '#3b82f6'}`, borderRadius: 3 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <EngineeringIcon sx={{ color: esPendiente ? '#059669' : '#2563eb', fontSize: 36 }} />
                        <Box>
                            <Typography variant="h6" fontWeight="800" sx={{ color: esPendiente ? '#065f46' : '#1e40af' }}>
                                {esPendiente ? 'Orden Lista para Iniciar' : 'Trabajo en Progreso'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: esPendiente ? '#047857' : '#1d4ed8' }}>
                                {esPendiente
                                    ? 'Haz clic en el botón de abajo para marcar el inicio del trabajo y activar el cronómetro.'
                                    : 'Registra los avances, sube fotos y solicita la revisión cuando termines las labores.'}
                            </Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />
                    {esPendiente && (
                        <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            size="large"
                            onClick={() => handleTecnicoAccion('En Progreso')}
                            disabled={actionLoading}
                            sx={{
                                py: 1.8,
                                fontWeight: '800',
                                fontSize: '1.15rem',
                                borderRadius: 2.5,
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                            }}
                        >
                            {actionLoading ? <CircularProgress size={26} color="inherit" /> : "Iniciar Trabajo Ahora"}
                        </Button>
                    )}
                    {esEnProgreso && (
                        <Button
                            variant="contained"
                            color="warning"
                            fullWidth
                            size="large"
                            startIcon={<AssignmentTurnedInIcon />}
                            onClick={() => handleTecnicoAccion('En Revisión')}
                            disabled={actionLoading}
                            sx={{
                                py: 1.8,
                                fontWeight: '800',
                                fontSize: '1.15rem',
                                borderRadius: 2.5,
                                bgcolor: '#f59e0b',
                                '&:hover': { bgcolor: '#d97706' },
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                            }}
                        >
                            {actionLoading ? <CircularProgress size={26} color="inherit" /> : "Finalizar y Solicitar Revisión"}
                        </Button>
                    )}
                </Paper>
            )}

            {esTecnico && esRevision && (
                <Alert severity="warning" sx={{ mb: 4, borderRadius: 2.5 }} icon={<SupervisorAccountIcon fontSize="inherit" />}>
                    <strong>Trabajo en Revisión:</strong> Esperando que el Supervisor evalúe y apruebe las evidencias de tu trabajo.
                </Alert>
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

            {/* ENCABEZADO DE ORDEN (COLAPSABLE / MINIMIZADO EN PROGRESO) */}
            <Paper
                elevation={2}
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: 3,
                    borderLeft: `6px solid ${orden.estado_data?.color || '#1976d2'}`,
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeftWidth: '6px'
                }}
            >
                {/* FILA DE RESUMEN SIEMPRE VISIBLE */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
                    <Box sx={{ flex: 1, minWidth: 260 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8, flexWrap: 'wrap' }}>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a' }}>
                                {orden.titulo}
                            </Typography>
                            <Chip
                                size="small"
                                label={orden.estado_data?.nombre}
                                sx={{
                                    bgcolor: orden.estado_data?.color,
                                    color: 'white',
                                    fontWeight: '800',
                                    fontSize: '0.75rem',
                                    height: 24
                                }}
                            />
                        </Box>

                        {/* DATOS RÁPIDOS DE CONTACTO */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 700 }}>
                                Cliente: <span style={{ fontWeight: 500 }}>{orden.cliente_nombre}</span>
                            </Typography>

                            {orden.cliente_telefono && (
                                <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 700 }}>
                                    Tel: <a href={`tel:${orden.cliente_telefono}`} style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>{orden.cliente_telefono}</a>
                                </Typography>
                            )}

                            {orden.direccion && (
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                    {orden.direccion}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {userRol !== 'Cliente' && (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setDetallesExpandidos(!detallesExpandidos)}
                            endIcon={detallesExpandidos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                color: '#475569',
                                borderColor: '#cbd5e1',
                                py: 0.5,
                                px: 1.5
                            }}
                        >
                            {detallesExpandidos ? "Minimizar detalles" : "Ver detalles y mapa"}
                        </Button>
                    )}
                </Box>

                {/* DETALLES COMPLETOS COLAPSABLES */}
                <Collapse in={detallesExpandidos || esPendiente || userRol === 'Cliente'}>
                    <Box sx={{ mt: 2.5, pt: 2.5, borderTop: '1px solid #f1f5f9' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={orden.foto_referencia ? 6 : 12}>
                                {orden.cliente_cedula && (
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <strong>Cédula:</strong> {orden.cliente_cedula}
                                    </Typography>
                                )}
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Técnico Asignado:</strong> {orden.tecnico_nombre || "No asignado"}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    <strong>Supervisor:</strong> {orden.supervisor_nombre || "No asignado"}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Dirección:</strong> {orden.direccion || "Sin dirección"}
                                </Typography>

                                {orden.descripcion && (
                                    <Box sx={{ mt: 1.5, bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">DESCRIPCIÓN DEL SERVICIO:</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, color: '#334155' }}>{orden.descripcion}</Typography>
                                    </Box>
                                )}
                            </Grid>

                            {orden.foto_referencia && (
                                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1 }}>FOTO DE REFERENCIA / FACHADA</Typography>
                                    <img
                                        src={orden.foto_referencia}
                                        alt="Fachada"
                                        style={{ maxHeight: '140px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
                                        onClick={() => handleOpenLightbox(orden.foto_referencia)}
                                    />
                                </Grid>
                            )}
                        </Grid>

                        {tieneGPS && (
                            <Box sx={{ mt: 2.5 }}>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocationOnIcon color="error" fontSize="small" /> Ubicación GPS
                                    </Typography>
                                    <Button variant="outlined" size="small" startIcon={<MapIcon />} href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank">
                                        Navegar
                                    </Button>
                                </Box>
                                <Box sx={{ height: '220px', width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #ccc' }}>
                                    <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[lat, lng]}><Popup>Ubicación del trabajo</Popup></Marker>
                                    </MapContainer>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </Paper>

            {/* ==================================================================== */}
            {/* PANEL: HERRAMIENTAS Y MATERIALES ASIGNADOS (SOLO STAFF / NO CLIENTES) */}
            {/* ==================================================================== */}
            {userRol !== 'Cliente' && (
                <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2.5}>
                        <Typography variant="h6" fontWeight="800" sx={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HandymanIcon sx={{ color: '#0288d1' }} /> Herramientas y Materiales de la Orden
                        </Typography>

                        {esTecnico && esEnProgreso && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleAbrirModalSolicitarInsumo}
                                sx={{
                                    bgcolor: '#2563eb',
                                    '&:hover': { bgcolor: '#1d4ed8' },
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    px: 2,
                                    py: 0.6
                                }}
                            >
                                + Solicitar Insumo Adicional
                            </Button>
                        )}
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    {/* BANNER DE SOLICITUDES PENDIENTES DE APROBACIÓN (PARA SUPERVISOR / ADMIN) */}
                    {esSupervisorOAdmin && solicitudesInsumos.filter(s => s.estado === 'PENDIENTE').length > 0 && (
                        <Box sx={{ mb: 3, p: 2.5, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2.5 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                <WarningIcon sx={{ color: '#d97706', fontSize: 22 }} />
                                <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#b45309' }}>
                                    Solicitudes de Insumos Pendientes de Aprobación ({solicitudesInsumos.filter(s => s.estado === 'PENDIENTE').length})
                                </Typography>
                            </Box>
                            <Stack spacing={1.5}>
                                {solicitudesInsumos.filter(s => s.estado === 'PENDIENTE').map(sol => (
                                    <Box key={sol.id} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #fef3c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="800" sx={{ color: '#0f172a' }}>
                                                {sol.cantidad}x {sol.item_nombre} <Chip label={sol.tipo_item} size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: '#f1f5f9', fontWeight: 'bold' }} />
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                                                <strong>Técnico:</strong> {sol.solicitado_por_nombre} | <strong>Motivo:</strong> {sol.motivo}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                onClick={() => handleAprobarSolicitudInsumo(sol.id)}
                                                disabled={actionLoading}
                                                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, fontSize: '0.78rem' }}
                                            >
                                                Aprobar Despacho
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => handleAbrirRechazoInsumo(sol)}
                                                disabled={actionLoading}
                                                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, fontSize: '0.78rem' }}
                                            >
                                                Rechazar
                                            </Button>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    <Grid container spacing={3}>
                        {/* COLUMNA 1: HERRAMIENTAS RETORNABLES */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight="800" color="#334155" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BuildIcon fontSize="small" sx={{ color: '#e65100' }} /> Herramientas Asignadas ({herramientasAsignadas.length})
                                </Typography>
                            </Box>

                            {herramientasAsignadas.length === 0 ? (
                                <Box sx={{ p: 4, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                    <Typography variant="body2" color="#94a3b8" fontWeight="500">No se asignaron herramientas a esta orden.</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={2}>
                                    {herramientasAsignadas.map((asig) => {
                                        const cant = Number(asig.cantidad) || 1;
                                        const cantTexto = Math.round(cant);

                                        return (
                                            <Box
                                                key={asig.id}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    p: 2.2,
                                                    borderRadius: 3,
                                                    bgcolor: asig.devuelta ? '#f0fdf4' : '#ffffff',
                                                    border: `1px solid ${asig.devuelta ? '#bbf7d0' : '#e2e8f0'}`,
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': { bgcolor: asig.devuelta ? '#dcfce7' : '#f8fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                                                    <Avatar sx={{ width: 44, height: 44, bgcolor: asig.devuelta ? '#dcfce7' : '#fff7ed', color: asig.devuelta ? '#16a34a' : '#c2410c', flexShrink: 0 }}>
                                                        <BuildIcon fontSize="small" />
                                                    </Avatar>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body1" fontWeight="800" color="#0f172a" noWrap>
                                                            {asig.herramienta_nombre}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2, flexShrink: 0 }}>
                                                    <Chip
                                                        label={`${cantTexto} ${cant === 1 ? 'Unidad' : 'Unidades'}`}
                                                        sx={{
                                                            fontWeight: 800,
                                                            fontSize: '0.8rem',
                                                            px: 1,
                                                            height: 28,
                                                            borderRadius: 2,
                                                            bgcolor: '#fff7ed',
                                                            color: '#c2410c',
                                                            border: '1px solid #fed7aa'
                                                        }}
                                                    />
                                                    {(asig.devuelta || esFinalizado) && (
                                                        <Chip
                                                            size="small"
                                                            label="Devuelta"
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: '0.75rem',
                                                                bgcolor: '#dcfce7',
                                                                color: '#166534',
                                                                border: '1px solid #86efac'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Grid>

                        {/* COLUMNA 2: MATERIALES CONSUMIBLES */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight="800" color="#334155" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Inventory2Icon fontSize="small" sx={{ color: '#0288d1' }} />
                                    {esPendiente ? `Materiales Asignados (${materialesUsados.length})` : `Materiales y Consumo (${materialesUsados.length})`}
                                </Typography>
                            </Box>

                            {materialesUsados.length === 0 ? (
                                <Box sx={{ p: 4, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                    <Typography variant="body2" color="#94a3b8" fontWeight="500">No se han registrado materiales para esta orden.</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={2}>
                                    {materialesUsados.map((uso) => {
                                        const cantEstimada = Math.round(Number(uso.cantidad_estimada)) || 0;
                                        const cantReal = Math.round(Number(uso.cantidad_real)) || 0;
                                        const estimadaTexto = cantEstimada;
                                        const realTexto = cantReal;
                                        const unidad = uso.material_unidad ? (uso.material_unidad.toLowerCase() === 'unidad' && cantEstimada !== 1 ? 'Unidades' : uso.material_unidad) : 'Unidades';

                                        return (
                                            <Box
                                                key={uso.id}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    p: 2.2,
                                                    borderRadius: 3,
                                                    bgcolor: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': { bgcolor: '#f8fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                                                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#eff6ff', color: '#0288d1', flexShrink: 0 }}>
                                                        <Inventory2Icon fontSize="small" />
                                                    </Avatar>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body1" fontWeight="800" color="#0f172a" noWrap>
                                                            {uso.material_nombre}
                                                        </Typography>
                                                        <Typography variant="caption" color="#64748b" fontWeight="600" sx={{ display: 'block', mt: 0.2 }}>
                                                            Asignados: {estimadaTexto} {unidad}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, ml: 2, flexShrink: 0 }}>
                                                    {esPendiente ? (
                                                        <Chip
                                                            label={`${estimadaTexto} ${unidad}`}
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: '0.8rem',
                                                                px: 1.2,
                                                                height: 28,
                                                                borderRadius: 2,
                                                                bgcolor: '#eff6ff',
                                                                color: '#1d4ed8',
                                                                border: '1px solid #bfdbfe'
                                                            }}
                                                        />
                                                    ) : (
                                                        <>
                                                            {cantReal > 0 ? (
                                                                <Chip
                                                                    label={`Usados: ${realTexto} de ${estimadaTexto}`}
                                                                    sx={{
                                                                        fontWeight: 800,
                                                                        fontSize: '0.78rem',
                                                                        px: 1.2,
                                                                        height: 28,
                                                                        borderRadius: 2,
                                                                        bgcolor: '#f0fdf4',
                                                                        color: '#166534',
                                                                        border: '1px solid #86efac'
                                                                    }}
                                                                />
                                                            ) : (
                                                                // Si no ha registrado aún:
                                                                esTecnico && !esRevision && !esFinalizado ? (
                                                                    <Stack direction="row" spacing={1}>
                                                                        <Button
                                                                            size="small"
                                                                            variant="outlined"
                                                                            onClick={() => handleAbrirModalConsumo(uso)}
                                                                            sx={{
                                                                                textTransform: 'none',
                                                                                py: 0.3,
                                                                                px: 1.2,
                                                                                fontSize: '0.75rem',
                                                                                borderRadius: 2,
                                                                                fontWeight: 700,
                                                                                borderColor: '#94a3b8',
                                                                                color: '#334155'
                                                                            }}
                                                                        >
                                                                            Registrar
                                                                        </Button>
                                                                        <Button
                                                                            size="small"
                                                                            variant="contained"
                                                                            onClick={() => handleConsumirTodo(uso)}
                                                                            sx={{
                                                                                textTransform: 'none',
                                                                                py: 0.3,
                                                                                px: 1.2,
                                                                                fontSize: '0.75rem',
                                                                                borderRadius: 2,
                                                                                fontWeight: 700,
                                                                                bgcolor: '#0288d1',
                                                                                '&:hover': { bgcolor: '#01579b' }
                                                                            }}
                                                                        >
                                                                            Usé todo ({estimadaTexto})
                                                                        </Button>
                                                                    </Stack>
                                                                ) : (
                                                                    <Chip
                                                                        label={`Asignados: ${estimadaTexto} ${unidad}`}
                                                                        sx={{
                                                                            fontWeight: 800,
                                                                            fontSize: '0.8rem',
                                                                            px: 1.2,
                                                                            height: 28,
                                                                            borderRadius: 2,
                                                                            bgcolor: '#eff6ff',
                                                                            color: '#1d4ed8',
                                                                            border: '1px solid #bfdbfe'
                                                                        }}
                                                                    />
                                                                )
                                                            )}

                                                            {cantReal > 0 && esTecnico && !esRevision && !esFinalizado && (
                                                                <Button
                                                                    size="small"
                                                                    variant="text"
                                                                    onClick={() => handleAbrirModalConsumo(uso)}
                                                                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', minWidth: 'auto' }}
                                                                >
                                                                    Modificar
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Grid>
                    </Grid>

                    {/* HISTORIAL DE SOLICITUDES DE INSUMOS */}
                    {solicitudesInsumos.length > 0 && (
                        <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f1f5f9' }}>
                            <Typography variant="subtitle2" fontWeight="800" color="#334155" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AssignmentTurnedInIcon fontSize="small" sx={{ color: '#6366f1' }} /> Historial de Solicitudes de Insumos ({solicitudesInsumos.length})
                            </Typography>
                            <Stack spacing={1}>
                                {solicitudesInsumos.map(sol => (
                                    <Box key={sol.id} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="700" sx={{ color: '#0f172a' }}>
                                                {sol.cantidad}x {sol.item_nombre} <Chip label={sol.tipo_item} size="small" sx={{ fontSize: '0.68rem', height: 18, bgcolor: '#e2e8f0', ml: 0.5 }} />
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Solicitado por: <strong>{sol.solicitado_por_nombre}</strong> | Motivo: <em>"{sol.motivo}"</em>
                                            </Typography>
                                            {sol.observacion_resolucion && (
                                                <Typography variant="caption" sx={{ color: '#ef4444', display: 'block' }}>
                                                    Obs: {sol.observacion_resolucion}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Chip
                                            label={sol.estado === 'PENDIENTE' ? 'Pendiente' : sol.estado === 'APROBADA' ? 'Aprobada' : 'Rechazada'}
                                            size="small"
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '0.75rem',
                                                bgcolor: sol.estado === 'APROBADA' ? '#dcfce7' : sol.estado === 'PENDIENTE' ? '#fef3c7' : '#fee2e2',
                                                color: sol.estado === 'APROBADA' ? '#15803d' : sol.estado === 'PENDIENTE' ? '#b45309' : '#b91c1c',
                                                border: `1px solid ${sol.estado === 'APROBADA' ? '#86efac' : sol.estado === 'PENDIENTE' ? '#fde68a' : '#fca5a5'}`
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Paper>
            )}

            {/* FORMULARIO BITÁCORA */}
            {userRol !== 'Cliente' && !esPendiente && !esRevision && orden.estado_data?.nombre !== 'Finalizado' && (
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>Bitácora de Avances</Typography>
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

            {/* HISTORIAL DE ACTIVIDAD (STAFF: TÉCNICOS, SUPERVISORES, ADMINS) */}
            {userRol !== 'Cliente' && !esPendiente && (
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
                    Editar Orden de Trabajo #{orden?.id}
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
                                {listaClientes.map(c => {
                                    const nombre = `${c.first_name || ''} ${c.last_name || ''}`.trim();
                                    const doc = c.cedula || c.username;
                                    return (
                                        <MenuItem key={c.id} value={c.id}>
                                            {nombre ? `${nombre} (C.I. ${doc})` : `C.I. ${doc}`}
                                        </MenuItem>
                                    );
                                })}
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
                                {listaTecnicos.map(t => {
                                    const nombre = `${t.first_name || ''} ${t.last_name || ''}`.trim();
                                    const doc = t.cedula || t.username;
                                    return (
                                        <MenuItem key={t.id} value={t.id}>
                                            {nombre ? `${nombre} (C.I. ${doc})` : `C.I. ${doc}`}
                                        </MenuItem>
                                    );
                                })}
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
                                    {listaSupervisores.map(s => {
                                        const nombre = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                                        const doc = s.cedula || s.username;
                                        return (
                                            <MenuItem key={s.id} value={s.id}>
                                                {nombre ? `${nombre} (C.I. ${doc})` : `C.I. ${doc}`}
                                            </MenuItem>
                                        );
                                    })}
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

            {/* ==================================================================== */}
            {/* MODAL: REGISTRAR / AJUSTAR CONSUMO REAL DE MATERIAL */}
            {/* ==================================================================== */}
            <Dialog open={openModalConsumo} onClose={() => setOpenModalConsumo(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
                <form onSubmit={handleGuardarConsumo}>
                    <DialogTitle sx={{ fontWeight: 'bold' }}>
                        Registrar Consumo de Material
                    </DialogTitle>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {materialSeleccionadoConsumo && (() => {
                            const cantEst = Number(materialSeleccionadoConsumo.cantidad_estimada) || 0;
                            const cantEstEntero = Math.round(cantEst);
                            const unidad = materialSeleccionadoConsumo.material_unidad ? (materialSeleccionadoConsumo.material_unidad.toLowerCase() === 'unidad' && cantEstEntero !== 1 ? 'Unidades' : materialSeleccionadoConsumo.material_unidad) : 'Unidades';
                            return (
                                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="#1e293b">
                                        {materialSeleccionadoConsumo.material_nombre}
                                    </Typography>
                                    <Typography variant="caption" color="#64748b" fontWeight="600">
                                        Cantidad Asignada: {cantEstEntero} {unidad}
                                    </Typography>
                                </Box>
                            );
                        })()}
                        <TextField
                            label="Cantidad Real Utilizada"
                            type="number"
                            required
                            autoFocus
                            fullWidth
                            inputProps={{ min: "0", step: "1" }}
                            value={cantidadConsumoInput}
                            onChange={(e) => setCantidadConsumoInput(e.target.value)}
                            helperText="Esta cantidad se descontará automáticamente del stock en almacén."
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenModalConsumo(false)} color="inherit">Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={actionLoading}>
                            {actionLoading ? <CircularProgress size={20} /> : "Confirmar Consumo"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* ==================================================================== */}
            {/* MODAL: CHECKLIST FINAL DE MATERIALES AL FINALIZAR EL TRABAJO */}
            {/* ==================================================================== */}
            <Dialog
                open={openModalChecklist}
                onClose={() => setOpenModalChecklist(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#0288d1' }}>
                        <Inventory2Icon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="800">Confirmación de Materiales Utilizados</Typography>
                        <Typography variant="caption" color="#64748b" fontWeight="500">
                            Revisa y confirma las cantidades utilizadas antes de enviar la orden a revisión.
                        </Typography>
                    </Box>
                </DialogTitle>

                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2.5 }}>
                    {materialesUsados.map((uso) => {
                        const cantEstimada = Math.round(Number(uso.cantidad_estimada)) || 0;
                        const estimadaTexto = cantEstimada;
                        const unidad = uso.material_unidad ? (uso.material_unidad.toLowerCase() === 'unidad' && cantEstimada !== 1 ? 'Unidades' : uso.material_unidad) : 'Unidades';
                        const valorCrudo = checklistMateriales[uso.id] !== undefined ? checklistMateriales[uso.id] : (uso.cantidad_real > 0 ? uso.cantidad_real : cantEstimada);
                        const valorActual = Math.round(Number(valorCrudo)) || 0;

                        return (
                            <Box
                                key={uso.id}
                                sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    bgcolor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 2
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body1" fontWeight="800" color="#1e293b">
                                        {uso.material_nombre}
                                    </Typography>
                                    <Typography variant="caption" color="#64748b" fontWeight="600">
                                        Entregados para el trabajo: {estimadaTexto} {unidad}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField
                                        size="small"
                                        type="number"
                                        inputProps={{ min: 0, step: "any", style: { textAlign: 'center', fontWeight: 800, width: 65 } }}
                                        value={valorActual}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setChecklistMateriales(prev => ({
                                                ...prev,
                                                [uso.id]: val
                                            }));
                                        }}
                                        label="Usados"
                                        sx={{ bgcolor: '#ffffff', borderRadius: 1.5 }}
                                    />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            setChecklistMateriales(prev => ({
                                                ...prev,
                                                [uso.id]: cantEstimada
                                            }));
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.8, px: 1, fontWeight: 700, borderRadius: 1.5, borderColor: '#cbd5e1', color: '#475569' }}
                                    >
                                        Todos ({estimadaTexto})
                                    </Button>
                                </Box>
                            </Box>
                        );
                    })}
                </DialogContent>

                <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpenModalChecklist(false)} color="inherit" sx={{ fontWeight: 700 }}>
                        Volver
                    </Button>
                    <Button
                        onClick={handleConfirmarChecklist}
                        variant="contained"
                        color="warning"
                        disabled={actionLoading}
                        sx={{
                            fontWeight: 800,
                            py: 1.2,
                            px: 3,
                            borderRadius: 2,
                            bgcolor: '#f59e0b',
                            '&:hover': { bgcolor: '#d97706' }
                        }}
                    >
                        {actionLoading ? <CircularProgress size={22} color="inherit" /> : "Confirmar y Solicitar Revisión"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL: SOLICITAR INSUMO ADICIONAL (TÉCNICO) */}
            <Dialog open={openModalSolicitarInsumo} onClose={() => setOpenModalSolicitarInsumo(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HandymanIcon sx={{ color: '#2563eb' }} /> Solicitar Insumo Adicional para Campo
                </DialogTitle>
                <Box component="form" onSubmit={handleEnviarSolicitudInsumo}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Indica qué herramienta o material necesitas para continuar con la ejecución de la orden. Se notificará a tu supervisor y administrador para su aprobación y despacho.
                        </Typography>

                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo de Insumo</InputLabel>
                            <Select
                                value={tipoInsumo}
                                label="Tipo de Insumo"
                                onChange={(e) => {
                                    setTipoInsumo(e.target.value);
                                    setItemInsumoSeleccionado('');
                                }}
                            >
                                <MenuItem value="MATERIAL">Material Consumible</MenuItem>
                                <MenuItem value="HERRAMIENTA">Herramienta</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Seleccionar Ítem del Inventario</InputLabel>
                            <Select
                                value={itemInsumoSeleccionado}
                                label="Seleccionar Ítem del Inventario"
                                onChange={(e) => setItemInsumoSeleccionado(e.target.value)}
                            >
                                {inventarioItems
                                    .filter(it => it.tipo === tipoInsumo)
                                    .map(it => (
                                        <MenuItem key={it.id} value={it.id}>
                                            {it.nombre} {tipoInsumo === 'MATERIAL' ? `(Stock: ${parseInt(it.stock_actual)} ${it.unidad_medida})` : `[${it.codigo}]`}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>

                        {tipoInsumo === 'MATERIAL' && (
                            <TextField
                                label="Cantidad Requerida"
                                type="number"
                                size="small"
                                fullWidth
                                inputProps={{ min: 1, step: 1 }}
                                value={cantidadInsumoSolicitada}
                                onChange={(e) => setCantidadInsumoSolicitada(e.target.value)}
                            />
                        )}

                        <TextField
                            label="Motivo / Justificación"
                            placeholder="Ej: Se requieren 15 metros adicionales porque la tubería pasa por el ala norte..."
                            multiline
                            rows={3}
                            fullWidth
                            size="small"
                            value={motivoInsumoSolicitado}
                            onChange={(e) => setMotivoInsumoSolicitado(e.target.value)}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setOpenModalSolicitarInsumo(false)} color="inherit" sx={{ fontWeight: 700 }}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submittingInsumo}
                            sx={{ bgcolor: '#2563eb', fontWeight: 800, borderRadius: 2 }}
                        >
                            {submittingInsumo ? <CircularProgress size={20} color="inherit" /> : "Enviar Solicitud"}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* MODAL: RECHAZAR SOLICITUD DE INSUMO (SUPERVISOR / ADMIN) */}
            <Dialog open={openModalRechazarInsumo} onClose={() => setOpenModalRechazarInsumo(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: '#b91c1c' }}>Rechazar Solicitud de Insumo</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Indica al técnico por qué motivo no se aprueba el despacho de este insumo:
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        label="Observación / Motivo"
                        placeholder="Ej: Utilizar el material de reserva en vehículo..."
                        value={motivoRechazoInsumo}
                        onChange={(e) => setMotivoRechazoInsumo(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModalRechazarInsumo(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleConfirmarRechazoInsumo} variant="contained" color="error" disabled={actionLoading} sx={{ fontWeight: 800 }}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirmar Rechazo"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}