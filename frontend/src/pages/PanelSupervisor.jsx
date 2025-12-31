import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, CardActions, 
  Button, Grid, Chip, CircularProgress, Alert, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function PanelSupervisor() {
  const [ordenes, setOrdenes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Para el rechazo con motivo
  const [openRechazo, setOpenRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [ordenARechazar, setOrdenARechazar] = useState(null);

  const navigate = useNavigate();
  const userRol = localStorage.getItem('user_rol');
  const currentUserId = parseInt(localStorage.getItem('user_id'));

  useEffect(() => {
    // Validación de acceso básica
    if (userRol !== 'Supervisor' && userRol !== 'Administrador') {
      alert("Acceso denegado.");
      navigate('/dashboard');
      return;
    }
    fetchDatos();
  }, [userRol, navigate]);

  const fetchDatos = async () => {
    try {
      const [resOrdenes, resEstados] = await Promise.all([
        api.get('ordenes/'),
        api.get('estados/')
      ]);
      
      setEstados(resEstados.data);

      // --- FILTRADO DE SEGURIDAD ---
      const ordenesFiltradas = resOrdenes.data.filter(orden => {
        // 1. Primero, debe estar en estado "En Revisión"
        const esRevision = orden.estado_data?.nombre === 'En Revisión';
        if (!esRevision) return false;

        // 2. Reglas de Visibilidad
        if (userRol === 'Administrador') {
            return true; // El Admin ve TODO
        } else if (userRol === 'Supervisor') {
            // El Supervisor solo ve las que le asignaron a él explícitamente
            return orden.supervisor === currentUserId;
        }
        return false;
      });
      
      setOrdenes(ordenesFiltradas);

    } catch (error) {
      console.error("Error cargando revisiones", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (ordenId) => {
    try {
      if (!window.confirm("¿Estás seguro de aprobar este trabajo?")) return;

      const estadoFinalizado = estados.find(e => e.nombre === 'Finalizado');
      if (!estadoFinalizado) return alert("Error: No existe estado Finalizado");

      await api.patch(`ordenes/${ordenId}/`, {
        estado: estadoFinalizado.id,
        fecha_fin: new Date().toISOString()
      });

      setOrdenes(prev => prev.filter(o => o.id !== ordenId));
      alert("¡Trabajo aprobado y finalizado!");

    } catch (error) {
      console.error("Error al aprobar", error);
      alert("Error al aprobar.");
    }
  };

  const abrirModalRechazo = (ordenId) => {
    setOrdenARechazar(ordenId);
    setMotivoRechazo('');
    setOpenRechazo(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!motivoRechazo) return alert("Debes indicar un motivo.");
    
    try {
      const estadoProgreso = estados.find(e => e.nombre === 'En Progreso');
      
      await api.patch(`ordenes/${ordenARechazar}/`, {
        estado: estadoProgreso.id
      });
      
      // Opcional: Podrías crear un registro de Avance con el motivo del rechazo aquí

      setOrdenes(prev => prev.filter(o => o.id !== ordenARechazar));
      setOpenRechazo(false);
      alert("Trabajo devuelto al técnico.");

    } catch (error) {
      console.error("Error al rechazar", error);
    }
  };

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
            <Typography variant="h4" fontWeight="bold">
                Panel de Supervisión
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
                {userRol === 'Administrador' 
                    ? "Vista Global (Modo Administrador)" 
                    : "Gestionando tus asignaciones"}
            </Typography>
        </Box>
        <Chip 
            icon={<AssignmentIndIcon />}
            label={userRol} 
            color={userRol === 'Administrador' ? 'error' : 'primary'} 
            variant="outlined" 
            sx={{ fontWeight: 'bold', px: 1 }}
        />
      </Box>

      {ordenes.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2, py: 3 }} icon={<CheckCircleIcon fontSize="large"/>}>
            <Typography variant="h6">Todo al día</Typography>
            {userRol === 'Supervisor' 
                ? "No tienes trabajos asignados pendientes de revisión." 
                : "No hay trabajos pendientes de revisión en todo el sistema."}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {ordenes.map((orden) => (
            <Grid item xs={12} md={6} key={orden.id}>
              <Card elevation={4} sx={{ borderLeft: '6px solid #ed6c02', position: 'relative' }}>
                
                {/* Etiqueta si es Admin viendo trabajo de otro */}
                {userRol === 'Administrador' && orden.supervisor && orden.supervisor !== currentUserId && (
                    <Chip 
                        label={`Supervisor: ${orden.supervisor_nombre}`} 
                        size="small" 
                        color="default" 
                        sx={{ position: 'absolute', top: 10, right: 10, opacity: 0.8 }}
                    />
                )}

                <CardContent sx={{ pt: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {orden.titulo}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="action" fontSize="small"/> 
                            <strong>Técnico:</strong> {orden.tecnico_nombre || "Sin asignar"}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon color="action" fontSize="small"/> 
                            {orden.direccion}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 2, bgcolor: '#fff3e0', p: 1.5, borderRadius: 2, border: '1px dashed #ed6c02' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            DESCRIPCIÓN:
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                            {orden.descripcion}
                        </Typography>
                    </Box>

                    <Button 
                        sx={{ mt: 2 }}
                        size="small" 
                        variant="text" 
                        onClick={() => navigate(`/trabajo/${orden.id}`)}
                    >
                        Ver Evidencias y Bitácora Completa
                    </Button>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<CancelIcon />}
                        onClick={() => abrirModalRechazo(orden.id)}
                    >
                        Rechazar
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success" 
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAprobar(orden.id)}
                    >
                        Aprobar
                    </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* MODAL RECHAZO */}
      <Dialog open={openRechazo} onClose={() => setOpenRechazo(false)}>
        <DialogTitle>Corrección Requerida</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
            <Typography variant="body2" gutterBottom color="text.secondary">
                Explica brevemente por qué rechazas el trabajo para que el técnico sepa qué corregir.
            </Typography>
            <TextField
                autoFocus margin="dense"
                label="Motivo / Observación"
                fullWidth multiline rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenRechazo(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarRechazo} variant="contained" color="error">
                Enviar a Corrección
            </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}