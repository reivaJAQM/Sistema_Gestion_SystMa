import React, { useEffect, useState, useCallback } from 'react';
import { 
  Container, Typography, Box, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Divider, Avatar, Paper, Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import MapIcon from '@mui/icons-material/Map'; 
import VisibilityIcon from '@mui/icons-material/Visibility'; 
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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
  
  // OBTENEMOS ROL
  const userRol = localStorage.getItem('user_rol'); 

  const [modalOpen, setModalOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const fetchData = useCallback(async () => {
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
              tecnico_id: orden.tecnico,
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
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRol === 'Cliente') {
      navigate('/mis-solicitudes');
      return;
    }
    fetchData();
  }, [fetchData, navigate, userRol]);

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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      {/* --- HEADER --- */}
      <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2, mb: 4 
      }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
            Agenda de Trabajo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona y visualiza la programación operativa
          </Typography>
        </Box>
        
        {userRol !== 'Tecnico' && (
          <Button 
            variant="contained" 
            size="large"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate('/nueva-orden')}
            sx={{ 
                borderRadius: '12px', 
                textTransform: 'none', 
                fontWeight: 'bold',
                background: '#10b981', // Verde esmeralda consistente con Dashboard
                '&:hover': { background: '#059669' }
            }}
          >
            Agendar Trabajo
          </Button>
        )}
      </Box>

      <Paper elevation={1} sx={{ 
          p: { xs: 2, md: 4 }, 
          borderRadius: '24px', 
          bgcolor: '#ffffff',
          boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
          border: '1px solid #e9ecef',
          mb: 5 
      }}>
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
      </Paper>

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

              {/* CAMBIO PRINCIPAL AQUÍ:
                 Eliminamos la lógica compleja de botones y dejamos uno solo 
                 que redirige a la página de detalles para TODOS los usuarios.
              */}
              <Button 
                variant="contained" 
                color="primary" 
                endIcon={userRol === 'Tecnico' ? <ArrowForwardIcon /> : <VisibilityIcon />}
                onClick={() => navigate(`/trabajo/${ordenSeleccionada.id}`)}
                sx={{ borderRadius: 2, boxShadow: 2, fontWeight: 'bold', px: 3 }}
              >
                {userRol === 'Tecnico' ? 'Ver Detalles' : 'Ver Detalles'}
              </Button>

            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}