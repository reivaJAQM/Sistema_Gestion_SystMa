import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Divider, Avatar, Paper, Stack
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
import MapIcon from '@mui/icons-material/Map'; 

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
  
  const [listaEstados, setListaEstados] = useState([]);
  
  // 1. OBTENEMOS EL ID DEL USUARIO ADEMÁS DEL ROL
  const userRol = localStorage.getItem('user_rol'); 
  const userId = parseInt(localStorage.getItem('user_id')); // <--- NUEVO

  const [modalOpen, setModalOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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
              // 2. GUARDAMOS EL ID DEL TÉCNICO PARA COMPARARLO DESPUÉS
              tecnico_id: orden.tecnico, // <--- NUEVO
              
              supervisor: orden.supervisor_nombre || 'No asignado',
              direccion: orden.direccion,
              lat: orden.latitud,
              lng: orden.longitud,
              foto: orden.foto_referencia,
              estado: orden.estado_data ? orden.estado_data.nombre : 'Pendiente',
              colorEstado: orden.estado_data ? orden.estado_data.color : '#808080',
              fecha_inicio_texto: new Date(orden.fecha_inicio).toLocaleString()
          }
      }));
      setEventos(eventosFormateados);

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
      id: info.event.id,
      titulo: info.event.title,
      ...info.event.extendedProps
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setOrdenSeleccionada(null);
  };

  const cambiarEstado = async (nuevoNombreEstado) => {
    if (!ordenSeleccionada) return;

    const estadoObj = listaEstados.find(e => e.nombre === nuevoNombreEstado);
    
    if (!estadoObj) {
      alert(`Error: El estado "${nuevoNombreEstado}" no existe.`);
      return;
    }

    try {
      await api.patch(`ordenes/${ordenSeleccionada.id}/`, {
        estado: estadoObj.id
      });
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
            left: 'prev next today',
            center: 'title',
            right: 'dayGridMonth timeGridWeek'
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

      {/* --- MODAL DETALLES --- */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }} 
      >
        {ordenSeleccionada && (
          <>
            <DialogTitle sx={{ 
                bgcolor: ordenSeleccionada.colorEstado, 
                color: 'white', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>
                      ORDEN #{ordenSeleccionada.id}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                      {ordenSeleccionada.titulo}
                  </Typography>
              </Box>
              <Chip 
                label={ordenSeleccionada.estado} 
                sx={{ 
                    bgcolor: 'white', 
                    color: ordenSeleccionada.colorEstado, 
                    fontWeight: 'bold',
                    border: '1px solid rgba(0,0,0,0.1)'
                }} 
              />
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 3 }}>
              
              {ordenSeleccionada.foto && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={ordenSeleccionada.foto} 
                    alt="Referencia" 
                    style={{ 
                        maxHeight: '200px', 
                        borderRadius: '12px', 
                        maxWidth: '100%',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                    }} 
                  />
                </Box>
              )}

              <Stack spacing={3}>
                
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                    <Typography variant="body1" sx={{ color: '#495057', fontStyle: ordenSeleccionada.descripcion ? 'normal' : 'italic' }}>
                        {ordenSeleccionada.descripcion || "Sin descripción adicional."}
                    </Typography>
                </Paper>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2', width: 40, height: 40 }}>
                                <CalendarMonthIcon fontSize="small" />
                            </Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">FECHA INICIO</Typography>
                                <Typography variant="body2" fontWeight="500">{ordenSeleccionada.fecha_inicio_texto}</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: '#ffebee', color: '#d32f2f', width: 40, height: 40 }}>
                                <LocationOnIcon fontSize="small" />
                            </Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">DIRECCIÓN</Typography>
                                <Typography variant="body2" fontWeight="500" sx={{ lineHeight: 1.2 }}>
                                    {ordenSeleccionada.direccion || "Sin dirección"}
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                {ordenSeleccionada.lat && ordenSeleccionada.lng && (
                    <Button 
                        variant="outlined" 
                        fullWidth
                        size="large"
                        startIcon={<MapIcon />}
                        href={`https://www.google.com/maps/search/?api=1&query=${ordenSeleccionada.lat},${ordenSeleccionada.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                            borderRadius: 2, 
                            borderWidth: 2,
                            borderColor: '#1976d2', 
                            color: '#1976d2',
                            '&:hover': { borderWidth: 2, bgcolor: '#f0f7ff' }
                        }}
                    >
                        Abrir Ubicación GPS
                    </Button>
                )}

                <Divider>
                    <Chip label="EQUIPO ASIGNADO" size="small" sx={{ color: '#6c757d', fontWeight: 500 }} />
                </Divider>

                <Grid container spacing={2} justifyContent="center" alignItems="center">
                    {[
                        { label: 'Cliente', val: ordenSeleccionada.cliente, icon: <PersonIcon />, color: '#1976d2', bg: '#e3f2fd' },
                        { label: 'Técnico', val: ordenSeleccionada.tecnico, icon: <BuildIcon />, color: '#e65100', bg: '#fff3e0' },
                        { label: 'Supervisor', val: ordenSeleccionada.supervisor, icon: <SupervisorAccountIcon />, color: '#7b1fa2', bg: '#f3e5f5' }
                    ].map((item, idx) => (
                        <Grid item xs={4} key={idx}>
                            <Box sx={{ 
                                textAlign: 'center', 
                                p: 1.5, 
                                borderRadius: 2, 
                                bgcolor: item.bg,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: item.color, mb: 1, boxShadow: 1 }}>
                                    {React.cloneElement(item.icon, { fontSize: 'small' })}
                                </Avatar>
                                <Typography variant="caption" sx={{ color: item.color, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    {item.label}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" noWrap sx={{ width: '100%', textAlign: 'center' }}>
                                    {item.val}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between', bgcolor: '#f8f9fa' }}>
              <Button onClick={handleCloseModal} color="inherit" sx={{ fontWeight: 600 }}>
                Cerrar
              </Button>

              {/* 3. AQUÍ ESTÁ LA MAGIA: 
                  Verificamos que sea Técnico Y QUE EL ID DEL TÉCNICO COINCIDA CON EL SUYO.
                  Si no coincide, este bloque simplemente no se renderiza.
              */}
              {userRol === 'Tecnico' && ordenSeleccionada.tecnico_id === userId && (
                <Box>
                    {ordenSeleccionada.estado === 'Pendiente' && (
                        <Button 
                            variant="contained" 
                            color="primary"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => cambiarEstado('En Progreso')}
                            sx={{ borderRadius: 2, boxShadow: 2 }}
                        >
                            Empezar
                        </Button>
                    )}

                    {ordenSeleccionada.estado === 'En Progreso' && (
                        <Button 
                            variant="contained" 
                            color="warning" 
                            startIcon={<SupervisorAccountIcon />}
                            onClick={() => cambiarEstado('En Revisión')}
                            sx={{ borderRadius: 2, boxShadow: 2 }}
                        >
                            Solicitar Revisión
                        </Button>
                    )}

                    {ordenSeleccionada.estado === 'En Revisión' && (
                        <Chip label="Esperando Aprobación" color="warning" variant="outlined" sx={{ fontWeight: 'bold' }}/>
                    )}
                </Box>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}