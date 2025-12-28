import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, TextField, Button, Divider, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Alert, Grid 
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SendIcon from '@mui/icons-material/Send';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MapIcon from '@mui/icons-material/Map'; // Icono para el botón de GPS
import LocationOnIcon from '@mui/icons-material/LocationOn';

import api from '../services/api';

// --- LEAFLET (Mapas) ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix del icono por defecto de Leaflet
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
  const [avances, setAvances] = useState([]);
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      const resOrden = await api.get(`ordenes/${id}/`);
      setOrden(resOrden.data);

      const resAvances = await api.get(`avances/?orden=${id}`);
      setAvances(resAvances.data);
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
      const response = await api.get(`ordenes/${id}/pdf/`, {
        responseType: 'blob',
      });
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

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  // Convertimos lat/long a números (vienen como strings del backend a veces)
  const lat = orden.latitud ? parseFloat(orden.latitud) : null;
  const lng = orden.longitud ? parseFloat(orden.longitud) : null;
  const tieneGPS = lat && lng;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      
      {/* Botonera Superior */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mis-trabajos')}>
            Volver
          </Button>

          <Button 
            variant="contained" 
            color="error" 
            startIcon={<PictureAsPdfIcon />} 
            onClick={descargarPDF}
          >
            Descargar PDF
          </Button>
      </Box>

      {/* --- ENCABEZADO DE LA ORDEN --- */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderLeft: '6px solid #1976d2' }}>
        <Typography variant="h5" fontWeight="bold">{orden.titulo}</Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="text.secondary">
                    <strong>Cliente:</strong> {orden.cliente_nombre}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    {orden.descripcion}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Dirección escrita:</strong> {orden.direccion || "Sin dirección"}
                </Typography>
            </Grid>
            
            {/* FOTO REFERENCIAL SI EXISTE */}
            {orden.foto_referencia && (
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                     <img 
                        src={orden.foto_referencia} 
                        alt="Fachada" 
                        style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid #ddd' }}
                     />
                </Grid>
            )}
        </Grid>

        {/* --- MAPA DE UBICACIÓN (NUEVO) --- */}
        {tieneGPS && (
            <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon color="error" fontSize="small" /> Ubicación GPS Confirmada
                    </Typography>
                    
                    {/* BOTÓN PARA ABRIR EN GOOGLE MAPS / WAZE */}
                    <Button 
                        variant="outlined" 
                        color="primary" 
                        size="small"
                        startIcon={<MapIcon />}
                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Navegar con GPS
                    </Button>
                </Box>
                
                <Box sx={{ height: '250px', width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #ccc' }}>
                    <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[lat, lng]}>
                            <Popup>Ubicación exacta del trabajo</Popup>
                        </Marker>
                    </MapContainer>
                </Box>
            </Box>
        )}

      </Paper>

      {/* --- FORMULARIO NUEVO AVANCE --- */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>📝 Registrar Nuevo Avance / Complicación</Typography>
        <Box component="form" onSubmit={handleEnviarAvance}>
          <TextField
            label="¿Qué se hizo hoy? ¿Hubo algún problema?"
            multiline rows={3}
            fullWidth
            value={nuevoTexto}
            onChange={(e) => setNuevoTexto(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant={nuevaFoto ? "contained" : "outlined"}
              component="label"
              color={nuevaFoto ? "success" : "primary"}
              startIcon={<PhotoCamera />}
            >
              {nuevaFoto ? "Foto Seleccionada" : "Subir Foto Evidencia"}
              <input type="file" hidden accept="image/*" onChange={(e) => setNuevaFoto(e.target.files[0])} />
            </Button>
            
            <Button type="submit" variant="contained" endIcon={<SendIcon />}>
              Guardar Reporte
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* --- LÍNEA DE TIEMPO (HISTORIAL) --- */}
      <Typography variant="h6" sx={{ mb: 2 }}>Historial de Avances</Typography>
      {avances.length === 0 ? (
        <Alert severity="info">Aún no hay registros en la bitácora de este trabajo.</Alert>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          {avances.map((avance) => (
            <React.Fragment key={avance.id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#1976d2' }}><AssignmentIcon /></Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography component="span" variant="subtitle2" color="text.primary">
                      {new Date(avance.creado_en).toLocaleString()}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                      <Typography component="span" variant="body1" color="text.primary">
                        {avance.contenido}
                      </Typography>
                      {avance.foto && (
                        <Box 
                          component="img" 
                          src={avance.foto} 
                          alt="Evidencia" 
                          sx={{ maxWidth: '200px', borderRadius: 1, border: '1px solid #ddd' }} 
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
    </Container>
  );
}