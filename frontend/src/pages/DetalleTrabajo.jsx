import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, TextField, Button, Divider, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Alert, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SendIcon from '@mui/icons-material/Send';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MapIcon from '@mui/icons-material/Map'; 
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import EngineeringIcon from '@mui/icons-material/Engineering';

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
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Rechazo (Supervisor)
  const [openRechazo, setOpenRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

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

  const handleEnviarAvance = async (e) => {
    e.preventDefault();
    if (!nuevoTexto && !nuevaFoto) return alert("Escribe algo o sube una foto");

    const formData = new FormData();
    formData.append('orden', id);
    formData.append('contenido', nuevoTexto);
    if (nuevaFoto) {
      formData.append('foto', nuevaFoto);
    }

    try {
      await api.post('avances/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNuevoTexto('');
      setNuevaFoto(null);
      cargarDatos(); 
    } catch (error) {
      console.error("Error enviando avance", error);
      alert("Error al guardar el avance");
    }
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

  // --- ACCIONES DE SUPERVISOR ---
  const handleAprobar = async () => {
    if (!window.confirm("¿Confirmas que el trabajo está correcto y finalizado?")) return;
    try {
        const estadoFinalizado = estados.find(e => e.nombre === 'Finalizado');
        await api.patch(`ordenes/${id}/`, {
            estado: estadoFinalizado.id,
            fecha_fin: new Date().toISOString()
        });
        
        const formData = new FormData();
        formData.append('orden', id);
        formData.append('contenido', '✅ TRABAJO APROBADO Y FINALIZADO POR SUPERVISIÓN.');
        await api.post('avances/', formData);

        alert("¡Trabajo finalizado con éxito!");
        navigate(-1); 
    } catch (error) {
        console.error("Error al aprobar", error);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo) return alert("Debes escribir el motivo del rechazo.");
    try {
        const estadoProgreso = estados.find(e => e.nombre === 'En Progreso');
        await api.patch(`ordenes/${id}/`, { estado: estadoProgreso.id });

        const formData = new FormData();
        formData.append('orden', id);
        formData.append('contenido', `❌ RECHAZADO: ${motivoRechazo}`);
        await api.post('avances/', formData);

        alert("Trabajo devuelto al técnico.");
        setOpenRechazo(false);
        navigate(-1);
    } catch (error) {
        console.error("Error al rechazar", error);
    }
  };

  const handleTecnicoAccion = async (nuevoEstadoNombre) => {
      const nuevoEstado = estados.find(e => e.nombre === nuevoEstadoNombre);
      if (!nuevoEstado) return alert(`Error: estado ${nuevoEstadoNombre} no encontrado`);

      try {
          await api.patch(`ordenes/${id}/`, { estado: nuevoEstado.id });
          
          const mensaje = nuevoEstadoNombre === 'En Progreso' 
            ? '▶ TRABAJO INICIADO POR EL TÉCNICO' 
            : '✋ REVISIÓN SOLICITADA POR EL TÉCNICO';

          const formData = new FormData();
          formData.append('orden', id);
          formData.append('contenido', mensaje);
          await api.post('avances/', formData);

          alert("Estado actualizado correctamente.");
          cargarDatos(); 
      } catch (error) {
          console.error("Error cambiando estado técnico", error);
      }
  };

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  // Variables para Mapas y Roles
  const lat = orden.latitud ? parseFloat(orden.latitud) : null;
  const lng = orden.longitud ? parseFloat(orden.longitud) : null;
  const tieneGPS = lat && lng;
  
  const esRevision = orden.estado_data?.nombre === 'En Revisión';
  const esPendiente = orden.estado_data?.nombre === 'Pendiente';
  const esEnProgreso = orden.estado_data?.nombre === 'En Progreso';
  const esFinalizado = orden.estado_data?.nombre === 'Finalizado';
  
  // =========================================================
  // CORRECCIÓN APLICADA AQUÍ:
  // Solo se permite acción si es Admin O (Supervisor Y Dueño de la orden)
  // =========================================================
  const esSupervisorOAdmin = userRol === 'Administrador' || (userRol === 'Supervisor' && orden.supervisor === userId);
  
  const esTecnicoAsignado = userRol === 'Tecnico' && orden.tecnico === userId;

  // --- LÓGICA PARA EL PDF ---
  // Solo Admin/Supervisor ASIGNADO Y solo si está Finalizado
  const mostrarBotonPDF = esSupervisorOAdmin && esFinalizado;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Volver</Button>
          
          {/* --- BOTÓN CONDICIONAL PDF --- */}
          {mostrarBotonPDF && (
            <Button variant="contained" color="error" startIcon={<PictureAsPdfIcon />} onClick={descargarPDF}>
                Descargar Reporte PDF
            </Button>
          )}
      </Box>

      {/* --- PANEL DE ACCIÓN: TÉCNICO --- */}
      {esTecnicoAsignado && !esRevision && orden.estado_data?.nombre !== 'Finalizado' && (
         <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#e3f2fd', border: '2px dashed #1976d2' }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <EngineeringIcon color="primary" fontSize="large" />
                <Box>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        Panel de Ejecución
                    </Typography>
                    <Typography variant="body2">
                        {esPendiente ? "Estás listo para comenzar? Marca el inicio aquí." : "Cuando termines, solicita la revisión."}
                    </Typography>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {esPendiente && (
                <Button 
                    variant="contained" color="success" fullWidth size="large"
                    startIcon={<PlayCircleFilledWhiteIcon />}
                    onClick={() => handleTecnicoAccion('En Progreso')}
                    sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                    ▶ INICIAR TRABAJO AHORA
                </Button>
            )}

            {esEnProgreso && (
                <Button 
                    variant="contained" color="warning" fullWidth size="large"
                    startIcon={<AssignmentTurnedInIcon />}
                    onClick={() => handleTecnicoAccion('En Revisión')}
                    sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                    ✋ FINALIZAR Y SOLICITAR REVISIÓN
                </Button>
            )}
         </Paper>
      )}
      
      {esTecnicoAsignado && esRevision && (
          <Alert severity="warning" sx={{ mb: 4 }} icon={<SupervisorAccountIcon fontSize="inherit" />}>
              <strong>Trabajo en Revisión:</strong> Esperando que el Supervisor apruebe o rechace tu trabajo.
          </Alert>
      )}

      {/* --- PANEL DE ACCIÓN: SUPERVISOR --- */}
      {esSupervisorOAdmin && esRevision && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#fff3e0', border: '2px dashed #ed6c02' }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <SupervisorAccountIcon color="warning" fontSize="large" />
                <Box>
                    <Typography variant="h6" fontWeight="bold">Revisión Requerida</Typography>
                    <Typography variant="body2">El técnico ha marcado este trabajo como terminado.</Typography>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setOpenRechazo(true)}>
                    Rechazar
                </Button>
                <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={handleAprobar}>
                    Aprobar
                </Button>
            </Box>
        </Paper>
      )}

      {/* --- ENCABEZADO DE LA ORDEN --- */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderLeft: `6px solid ${orden.estado_data?.color || '#1976d2'}` }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Typography variant="h5" fontWeight="bold" gutterBottom>{orden.titulo}</Typography>
            <Chip label={orden.estado_data?.nombre} sx={{ bgcolor: orden.estado_data?.color, color: 'white', fontWeight: 'bold' }} />
        </Box>
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1"><strong>Cliente:</strong> {orden.cliente_nombre}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{orden.descripcion}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Dirección:</strong> {orden.direccion || "Sin dirección"}</Typography>
            </Grid>
            {orden.foto_referencia && (
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                     <img src={orden.foto_referencia} alt="Fachada" style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid #ddd' }} />
                </Grid>
            )}
        </Grid>
        {tieneGPS && (
            <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon color="error" fontSize="small" /> Ubicación GPS
                    </Typography>
                    <Button variant="outlined" size="small" startIcon={<MapIcon />} href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank">
                        Navegar
                    </Button>
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

      {/* --- FORMULARIO BITÁCORA --- */}
      {orden.estado_data?.nombre !== 'Finalizado' && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>📝 Bitácora de Avances</Typography>
            <Box component="form" onSubmit={handleEnviarAvance}>
              <TextField
                label="Escribe aquí los detalles del trabajo..."
                multiline rows={3} fullWidth
                value={nuevoTexto} onChange={(e) => setNuevoTexto(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant={nuevaFoto ? "contained" : "outlined"} component="label" color={nuevaFoto ? "success" : "primary"} startIcon={<PhotoCamera />}>
                  {nuevaFoto ? "Foto Lista" : "Subir Evidencia"}
                  <input type="file" hidden accept="image/*" onChange={(e) => setNuevaFoto(e.target.files[0])} />
                </Button>
                <Button type="submit" variant="contained" endIcon={<SendIcon />}>Guardar</Button>
              </Box>
            </Box>
          </Paper>
      )}

      {/* --- HISTORIAL --- */}
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
                      {avance.foto && <Box component="img" src={avance.foto} alt="Evidencia" sx={{ maxWidth: '200px', borderRadius: 1, border: '1px solid #ddd' }} />}
                    </Box>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      {/* --- MODAL DE RECHAZO --- */}
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
    </Container>
  );
}