import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Divider, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// --- FULLCALENDAR ---
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; 
import timeGridPlugin from '@fullcalendar/timegrid'; 
import interactionPlugin from '@fullcalendar/interaction'; 
import esLocale from '@fullcalendar/core/locales/es'; 

export default function Calendario() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lista de estados disponibles (para saber el ID de "En Progreso", etc.)
  const [listaEstados, setListaEstados] = useState([]);
  
  // Datos del Usuario actual
  const userRol = localStorage.getItem('user_rol'); 

  // Estados para el Modal (Pop Up)
  const [modalOpen, setModalOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Cargar Órdenes
      const responseOrdenes = await api.get('ordenes/');
      const eventosFormateados = responseOrdenes.data
        .filter(orden => orden.fecha_inicio) 
        .map(orden => ({
          id: orden.id,
          title: orden.titulo,
          start: orden.fecha_inicio,
          end: null, 
          backgroundColor: orden.estado_data ? orden.estado_data.color : '#3788d8',
          extendedProps: {
              descripcion: orden.descripcion,
              cliente: orden.cliente_nombre || 'No asignado',
              tecnico: orden.tecnico_nombre || 'No asignado',
              supervisor: orden.supervisor_nombre || 'No asignado',
              direccion: orden.direccion,
              foto: orden.foto_referencia,
              estado: orden.estado_data ? orden.estado_data.nombre : 'Pendiente',
              colorEstado: orden.estado_data ? orden.estado_data.color : '#808080',
              fecha_inicio_texto: new Date(orden.fecha_inicio).toLocaleString()
          }
      }));
      setEventos(eventosFormateados);

      // 2. Cargar Estados (Para obtener sus IDs)
      const responseEstados = await api.get('estados/');
      setListaEstados(responseEstados.data);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info) => {
    setOrdenSeleccionada({
      id: info.event.id, // Necesitamos el ID para hacer el update
      titulo: info.event.title,
      ...info.event.extendedProps
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setOrdenSeleccionada(null);
  };

  // --- LÓGICA PARA CAMBIAR ESTADO ---
  const cambiarEstado = async (nuevoNombreEstado) => {
    if (!ordenSeleccionada) return;

    // Buscamos el ID del estado basado en su nombre (ej. "En Progreso")
    const estadoObj = listaEstados.find(e => e.nombre === nuevoNombreEstado);
    
    if (!estadoObj) {
      alert(`Error: El estado "${nuevoNombreEstado}" no existe en el sistema. Créalo en el admin.`);
      return;
    }

    try {
      // Enviamos el PATCH al backend
      await api.patch(`ordenes/${ordenSeleccionada.id}/`, {
        estado: estadoObj.id
      });
      
      // Cerramos modal y recargamos datos para ver el cambio de color
      setModalOpen(false);
      setLoading(true);
      fetchData(); 
      
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Hubo un error al actualizar el estado.");
    }
  };

  const renderEventContent = (eventInfo) => {
    return (
      <Box sx={{ p: 0.5, lineHeight: 1.2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
          {eventInfo.event.title}
        </Typography>
      </Box>
    );
  };

  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', mt:5 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
          Agenda de Trabajo
        </Typography>
        
        {/* CONDICIÓN AGREGADA: Solo mostramos si NO es técnico */}
        {userRol !== 'Tecnico' && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/nueva-orden')}
            sx={{ borderRadius: 2 }}
          >
            Agendar Trabajo
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 5 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
          }}
          locale={esLocale}
          events={eventos}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          displayEventTime={false}
          slotDuration="01:00:00"
          height="auto"
          contentHeight="auto"
          allDaySlot={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="07:00:00"
          forceEventDuration={true} 
          defaultTimedEventDuration="01:00:00" 
        />
      </Box>

      {/* --- POP UP (MODAL) DE DETALLES --- */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        {ordenSeleccionada && (
          <>
            <DialogTitle sx={{ bgcolor: ordenSeleccionada.colorEstado, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {ordenSeleccionada.titulo}
              <Chip 
                label={ordenSeleccionada.estado} 
                sx={{ bgcolor: 'white', color: 'black', fontWeight: 'bold' }} 
              />
            </DialogTitle>
            
            <DialogContent dividers>
              {ordenSeleccionada.foto && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={ordenSeleccionada.foto} 
                    alt="Referencia" 
                    style={{ maxHeight: '200px', borderRadius: '8px', maxWidth: '100%' }} 
                  />
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {ordenSeleccionada.descripcion || "Sin descripción adicional."}
                  </Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <CalendarMonthIcon color="action" />
                        <Typography variant="body2">{ordenSeleccionada.fecha_inicio_texto}</Typography>
                    </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <LocationOnIcon color="action" />
                        <Typography variant="body2">{ordenSeleccionada.direccion || "Sin dirección"}</Typography>
                    </Box>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">EQUIPO ASIGNADO</Typography>
                </Grid>
                <Grid item xs={4}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Avatar sx={{ bgcolor: '#1976d2', mb: 1 }}><PersonIcon /></Avatar>
                        <Typography variant="caption">Cliente</Typography>
                        <Typography variant="body2" fontWeight="bold">{ordenSeleccionada.cliente}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={4}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Avatar sx={{ bgcolor: '#e67e22', mb: 1 }}><BuildIcon /></Avatar>
                        <Typography variant="caption">Técnico</Typography>
                        <Typography variant="body2" fontWeight="bold">{ordenSeleccionada.tecnico}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={4}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Avatar sx={{ bgcolor: '#9b59b6', mb: 1 }}><SupervisorAccountIcon /></Avatar>
                        <Typography variant="caption">Supervisor</Typography>
                        <Typography variant="body2" fontWeight="bold">{ordenSeleccionada.supervisor}</Typography>
                    </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Button onClick={handleCloseModal} color="inherit">
                Cerrar
              </Button>

              {/* --- BOTONES DE ACCIÓN DEL TÉCNICO --- */}
              {userRol === 'Tecnico' && (
                <Box>
                    {ordenSeleccionada.estado === 'Pendiente' && (
                        <Button 
                            variant="contained" 
                            color="primary"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => cambiarEstado('En Progreso')}
                        >
                            Empezar Trabajo
                        </Button>
                    )}

                    {ordenSeleccionada.estado === 'En Progreso' && (
                        <Button 
                            variant="contained" 
                            color="warning" // Color naranja para indicar alerta/revisión
                            startIcon={<SupervisorAccountIcon />}
                            onClick={() => cambiarEstado('En Revisión')}
                        >
                            Solicitar Revisión
                        </Button>
                    )}

                    {ordenSeleccionada.estado === 'En Revisión' && (
                        <Chip label="Esperando Aprobación" color="warning" variant="outlined"/>
                    )}
                </Box>
              )}
              {/* ------------------------------------ */}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}