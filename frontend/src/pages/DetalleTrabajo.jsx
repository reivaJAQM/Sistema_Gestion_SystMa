import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, TextField, Button, Divider, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Alert
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SendIcon from '@mui/icons-material/Send';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // <--- Icono PDF
import api from '../services/api';

export default function DetalleTrabajo() {
  const { id } = useParams(); // ID de la orden
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
      // 1. Cargar info de la orden
      const resOrden = await api.get(`ordenes/${id}/`);
      setOrden(resOrden.data);

      // 2. Cargar historial de avances filtrados por esta orden
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
      // Limpiar y recargar
      setNuevoTexto('');
      setNuevaFoto(null);
      cargarDatos(); // Refrescamos la lista
    } catch (error) {
      console.error("Error enviando avance", error);
      alert("Error al guardar el avance");
    }
  };

  // --- FUNCIÓN PARA DESCARGAR PDF ---
  const descargarPDF = async () => {
    try {
      // Hacemos la petición pidiendo 'blob' (archivo binario)
      const response = await api.get(`ordenes/${id}/pdf/`, {
        responseType: 'blob',
      });
      
      // Creamos una URL temporal para el archivo descargado
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Orden_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiamos
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error descargando PDF", error);
      alert("No se pudo generar el reporte. Verifica que el servidor esté corriendo.");
    }
  };

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      
      {/* Botonera Superior: Volver + Descargar PDF */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mis-trabajos')}>
            Volver a Mis Trabajos
          </Button>

          <Button 
            variant="contained" 
            color="error" 
            startIcon={<PictureAsPdfIcon />} 
            onClick={descargarPDF}
          >
            Descargar Hoja de Servicio
          </Button>
      </Box>

      {/* --- ENCABEZADO DE LA ORDEN --- */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderLeft: '6px solid #1976d2' }}>
        <Typography variant="h5" fontWeight="bold">{orden.titulo}</Typography>
        <Typography variant="subtitle1" color="text.secondary">Cliente: {orden.cliente_nombre}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>{orden.descripcion}</Typography>
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