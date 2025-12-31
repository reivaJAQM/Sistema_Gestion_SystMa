import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, TextField, Button, Divider, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Alert, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton
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
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'; // <--- Nuevo
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'; // <--- Nuevo

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

  const userRol = localStorage.getItem('user_rol');
  const userId = parseInt(localStorage.getItem('user_id'));

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      const [resOrden, resAvances, resEstados] = await Promise.all([
        api.get(`ordenes/${id}/`),
        api.get(`avances/?orden=${id}`),
        api.get('estados/')
      ]);
      setOrden(resOrden.data);
      setAvances(resAvances.data);
      setEstados(resEstados.data);
    } catch (error) {
      console.error("Error al cargar datos", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA PARA RECOLECTAR TODAS LAS IMÁGENES ---
  const getTodasLasImagenes = () => {
      const imgs = [];
      if (orden && orden.foto_referencia) {
          imgs.push(orden.foto_referencia);
      }
      if (avances) {
          // Recorremos los avances en el orden en que se muestran (usualmente cronológico inverso o directo según tu API)
          avances.forEach(av => {
              if (av.imagenes && av.imagenes.length > 0) {
                  av.imagenes.forEach(img => imgs.push(img.foto));
              } else if (av.foto) {
                  imgs.push(av.foto);
              }
          });
      }
      return imgs;
  };
  const todasLasImagenes = getTodasLasImagenes();

  const handleOpenLightbox = (url) => {
      const idx = todasLasImagenes.findIndex(img => img === url);
      setPhotoIndex(idx !== -1 ? idx : 0);
  };

  const handleNextPhoto = () => {
      if (photoIndex < todasLasImagenes.length - 1) {
          setPhotoIndex(prev => prev + 1);
      }
  };

  const handlePrevPhoto = () => {
      if (photoIndex > 0) {
          setPhotoIndex(prev => prev - 1);
      }
  };

  // Manejo de teclado para el carrusel
  useEffect(() => {
      const handleKeyDown = (e) => {
          if (photoIndex === -1) return;
          if (e.key === 'ArrowRight') handleNextPhoto();
          if (e.key === 'ArrowLeft') handlePrevPhoto();
          if (e.key === 'Escape') setPhotoIndex(-1);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoIndex]);


  const handleEnviarAvance = async (e) => {
    e.preventDefault();
    if (!nuevoTexto && nuevasFotos.length === 0) return alert("Escribe algo o sube fotos");

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
    } catch (error) {
      console.error("Error enviando avance", error);
      alert("Error al guardar el avance");
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
      link.setAttribute('download', `Reporte_Orden_${id}.pdf`);
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
    // Mantenemos la confirmación inicial de seguridad
    if (!window.confirm("¿Confirmas que el trabajo está correcto y finalizado?")) return;
    
    try {
        const estadoFinalizado = estados.find(e => e.nombre === 'Finalizado');
        
        // 1. Cambiar estado a Finalizado
        await api.patch(`ordenes/${id}/`, {
            estado: estadoFinalizado.id,
            fecha_fin: new Date().toISOString()
        });
        
        // 2. Agregar hito en el historial
        const formData = new FormData();
        formData.append('orden', id);
        formData.append('contenido', '✅ TRABAJO APROBADO Y FINALIZADO POR SUPERVISIÓN.');
        await api.post('avances/', formData);

        // 3. MOSTRAR MODAL BONITO (En vez de alert + navigate)
        setSuccessMessage({ 
            title: "¡Orden Finalizada!", 
            subtext: "El trabajo ha sido aprobado correctamente. La orden ahora está cerrada." 
        });
        setShowSuccessModal(true);
        
        // 4. Recargar datos para ver el cambio (estado verde) sin recargar la página
        cargarDatos(); 

    } catch (error) {
        console.error("Error al aprobar", error);
        alert("Ocurrió un error al intentar finalizar la orden.");
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo) return alert("Debes escribir el motivo del rechazo.");
    
    try {
        const estadoProgreso = estados.find(e => e.nombre === 'En Progreso');
        
        // 1. Devolver estado a En Progreso
        await api.patch(`ordenes/${id}/`, { estado: estadoProgreso.id });

        // 2. Registrar el rechazo en bitácora
        const formData = new FormData();
        formData.append('orden', id);
        formData.append('contenido', `❌ RECHAZADO: ${motivoRechazo}`);
        await api.post('avances/', formData);

        // 3. MOSTRAR MODAL BONITO
        setSuccessMessage({ 
            title: "Devuelto a Corrección", 
            subtext: "El técnico ha sido notificado y la orden está nuevamente en progreso." 
        });
        setShowSuccessModal(true);
        setOpenRechazo(false); // Cierra el modal de escribir motivo
        
        // 4. Actualizar vista
        cargarDatos();

    } catch (error) {
        console.error("Error al rechazar", error);
        alert("Error al rechazar el trabajo.");
    }
  };
  
  const handleTecnicoAccion = async (nuevoEstadoNombre) => {
      const nuevoEstado = estados.find(e => e.nombre === nuevoEstadoNombre);
      if (!nuevoEstado) return alert(`Error: estado ${nuevoEstadoNombre} no encontrado`);

      try {
          let mensajeHistorial = '';
          let tituloModal = '';
          let cuerpoModal = '';

          if (nuevoEstadoNombre === 'En Progreso') {
              mensajeHistorial = '▶ TRABAJO INICIADO POR EL TÉCNICO';
              tituloModal = '¡Manos a la obra!';
              cuerpoModal = 'El cronómetro ha iniciado. No olvides registrar tus avances y subir evidencia.';
          } else {
              mensajeHistorial = '✋ REVISIÓN SOLICITADA POR EL TÉCNICO';
              tituloModal = '¡Excelente Trabajo!';
              cuerpoModal = 'Se ha notificado al supervisor. Mantente atento a la validación.';
          }

          const formData = new FormData();
          formData.append('orden', id);
          formData.append('contenido', mensajeHistorial);

          // --- LÓGICA CORREGIDA ---
          if (nuevoEstadoNombre === 'En Progreso') {
              // INICIAR: Primero Estado -> Luego Avance
              await api.patch(`ordenes/${id}/`, { estado: nuevoEstado.id });
              await api.post('avances/', formData);
          } else {
              // FINALIZAR: Primero Avance -> Luego Estado
              // (Si esto está al revés, fallará)
              await api.post('avances/', formData);
              await api.patch(`ordenes/${id}/`, { estado: nuevoEstado.id });
          }

          setSuccessMessage({ title: tituloModal, subtext: cuerpoModal });
          setShowSuccessModal(true);
          
          cargarDatos(); 
      } catch (error) {
          console.error("Error cambiando estado técnico", error);
          alert("Error al actualizar el estado. Intenta nuevamente.");
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
  const mostrarBotonPDF = esSupervisorOAdmin && esFinalizado;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Volver</Button>
          {mostrarBotonPDF && (
            <Button variant="contained" color="error" startIcon={<PictureAsPdfIcon />} onClick={descargarPDF}>Descargar Reporte PDF</Button>
          )}
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
                <Button variant="contained" color="success" fullWidth size="large" onClick={() => handleTecnicoAccion('En Progreso')} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}>Iniciar Trabajo</Button>
            )}
            {esEnProgreso && (
                <Button variant="contained" color="warning" fullWidth size="large" startIcon={<AssignmentTurnedInIcon />} onClick={() => handleTecnicoAccion('En Revisión')} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}>Finalizar y Solicitar Revisión</Button>
            )}
         </Paper>
      )}
      
      {esTecnicoAsignado && esRevision && (
          <Alert severity="warning" sx={{ mb: 4 }} icon={<SupervisorAccountIcon fontSize="inherit" />}><strong>Trabajo en Revisión:</strong> Esperando que el Supervisor apruebe o rechace tu trabajo.</Alert>
      )}

      {esSupervisorOAdmin && esRevision && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#fff3e0', border: '2px dashed #ed6c02' }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <SupervisorAccountIcon color="warning" fontSize="large" />
                <Box><Typography variant="h6" fontWeight="bold">Revisión Requerida</Typography><Typography variant="body2">El técnico ha marcado este trabajo como terminado.</Typography></Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setOpenRechazo(true)}>Rechazar</Button>
                <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={handleAprobar}>Aprobar</Button>
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
      {!esPendiente && !esRevision && orden.estado_data?.nombre !== 'Finalizado' && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>📝 Bitácora de Avances</Typography>
            <Box component="form" onSubmit={handleEnviarAvance}>
              <TextField
                label="Escribe aquí los detalles del trabajo..."
                multiline rows={3} fullWidth
                value={nuevoTexto} onChange={(e) => setNuevoTexto(e.target.value)}
                sx={{ mb: 2 }}
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
                <Button type="submit" variant="contained" endIcon={<SendIcon />}>Guardar Avance</Button>
              </Box>
            </Box>
          </Paper>
      )}

      {/* HISTORIAL */}
      {!esPendiente && (
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
                        primary={<Typography component="span" variant="subtitle2" color="text.primary">{new Date(avance.creado_en).toLocaleString()}</Typography>}
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
             <TextField autoFocus margin="dense" label="Motivo del rechazo" fullWidth multiline rows={3} value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} />
         </DialogContent>
         <DialogActions>
             <Button onClick={() => setOpenRechazo(false)}>Cancelar</Button>
             <Button onClick={handleRechazar} variant="contained" color="error">Confirmar</Button>
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

    </Container>
  );
}