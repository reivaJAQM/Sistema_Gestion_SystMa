import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, TextField, Button, Typography, Box, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  IconButton, Stack, Autocomplete, MenuItem 
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // <--- Nuevo Icono
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// --- LEAFLET MAPS ---
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

// --- COMPONENTE MARCADOR CLICKEABLE ---
function LocationMarker({ setPosicion, setDireccion }) {
    const [position, setPosition] = useState(null);
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            setPosicion(e.latlng); 
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export default function CrearOrden() {
  const navigate = useNavigate();
  const userRol = localStorage.getItem('user_rol');
  
  // Estados Formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');
  
  // GPS
  const [coords, setCoords] = useState(null); 

  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('09:00');
  
  // IDs Selección
  const [clienteId, setClienteId] = useState('');
  const [tecnicoId, setTecnicoId] = useState(null);
  const [supervisorId, setSupervisorId] = useState(null);
  const [foto, setFoto] = useState(null);

  // Listas
  const [listaClientes, setListaClientes] = useState([]);
  const [listaTecnicos, setListaTecnicos] = useState([]);
  const [listaSupervisores, setListaSupervisores] = useState([]);

  // Modales
  const [openModal, setOpenModal] = useState(false); // Modal Cliente
  const [showSuccessModal, setShowSuccessModal] = useState(false); // <--- NUEVO MODAL ÉXITO
  
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [nuevoClienteEmail, setNuevoClienteEmail] = useState('');

  // Generar Horarios
  const horariosDisponibles = [];
  for (let i = 7; i <= 20; i++) {
    const horaStr = i < 10 ? `0${i}:00` : `${i}:00`;
    horariosDisponibles.push(horaStr);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
        const promesas = [
            api.get('clientes/'),
            api.get('tecnicos/')
        ];
        if (userRol === 'Administrador') promesas.push(api.get('supervisores/'));

        const respuestas = await Promise.all(promesas);
        setListaClientes(respuestas[0].data);
        setListaTecnicos(respuestas[1].data);
        if (userRol === 'Administrador') setListaSupervisores(respuestas[2].data);
    } catch (error) {
        console.error("Error cargando listas", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    formData.append('direccion', direccion);
    formData.append('cliente', clienteId); 
    formData.append('estado', 1); 
    
    if (coords) {
        formData.append('latitud', coords.lat.toFixed(6));
        formData.append('longitud', coords.lng.toFixed(6));
    }

    if (tecnicoId) formData.append('tecnico', tecnicoId);
    if (fechaSeleccionada && horaSeleccionada) {
        formData.append('fecha_inicio', `${fechaSeleccionada}T${horaSeleccionada}`);
    }
    if (foto) formData.append('foto_referencia', foto);
    if (userRol === 'Administrador' && supervisorId) formData.append('supervisor', supervisorId);

    try {
      await api.post('ordenes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // --- CAMBIO: EN VEZ DE ALERT, MOSTRAMOS EL MODAL ---
      setShowSuccessModal(true); 

    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
          alert(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
          alert('Error al crear la orden.');
      }
    }
  };

  // --- FUNCIÓN PARA CERRAR Y REDIRIGIR ---
  const handleCloseSuccess = () => {
      setShowSuccessModal(false);
      if (userRol === 'Supervisor') navigate('/panel-supervisor');
      else navigate('/calendario');
  };

  const handleCrearCliente = async () => {
      if(!nuevoClienteNombre) return alert("Escribe un nombre");
      try {
          const payload = {
              username: nuevoClienteNombre.replace(/\s+/g, '_').toLowerCase() + Math.floor(Math.random() * 1000),
              first_name: nuevoClienteNombre,
              email: nuevoClienteEmail
          };
          const response = await api.post('clientes/', payload);
          const resClientes = await api.get('clientes/'); 
          setListaClientes(resClientes.data);
          setClienteId(response.data.id); 
          setOpenModal(false);
          setNuevoClienteNombre('');
          setNuevoClienteEmail('');
      } catch (error) {
          console.error(error);
      }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{fontWeight: 'bold'}}>
          Crear Orden
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          <TextField
            label="Título del Trabajo"
            placeholder="Ej: Mantenimiento Preventivo"
            required fullWidth
            value={titulo} onChange={(e) => setTitulo(e.target.value)}
          />

          {/* CLIENTE */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Autocomplete
                    fullWidth
                    options={listaClientes}
                    getOptionLabel={(option) => option.first_name ? `${option.first_name} (${option.username})` : option.username}
                    value={listaClientes.find(c => c.id === clienteId) || null}
                    onChange={(event, newValue) => setClienteId(newValue ? newValue.id : '')}
                    renderInput={(params) => <TextField {...params} label="Cliente" required />}
                />
                <IconButton color="primary" onClick={() => setOpenModal(true)}>
                    <AddCircleIcon fontSize="large" />
                </IconButton>
          </Box>

          {/* TÉCNICO / SUPERVISOR */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Autocomplete
                sx={{ flex: 1 }}
                options={listaTecnicos}
                getOptionLabel={(option) => option.first_name ? `${option.first_name} (${option.username})` : option.username}
                value={listaTecnicos.find(t => t.id === tecnicoId) || null}
                onChange={(event, newValue) => setTecnicoId(newValue ? newValue.id : null)}
                renderInput={(params) => <TextField {...params} label="Técnico Responsable" required />}
            />
            {userRol === 'Administrador' && (
                <Autocomplete
                    sx={{ flex: 1 }}
                    options={listaSupervisores}
                    getOptionLabel={(option) => option.first_name ? `${option.first_name} (${option.username})` : option.username}
                    value={listaSupervisores.find(s => s.id === supervisorId) || null}
                    onChange={(event, newValue) => setSupervisorId(newValue ? newValue.id : null)}
                    renderInput={(params) => <TextField {...params} label="Asignar Supervisor" />}
                />
            )}
          </Box>

          {/* FECHA Y HORA */}
          <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                  label="Fecha de Inicio"
                  type="date"
                  fullWidth required
                  InputLabelProps={{ shrink: true }}
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
              />
              <TextField
                  select label="Hora" required
                  value={horaSeleccionada}
                  onChange={(e) => setHoraSeleccionada(e.target.value)}
                  sx={{ minWidth: 150 }}
              >
                  {horariosDisponibles.map((hora) => (
                      <MenuItem key={hora} value={hora}>{hora}</MenuItem>
                  ))}
              </TextField>
          </Box>

          {/* MAPA GPS */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon color="error" fontSize="small"/> Ubicación Exacta (Selecciona en el mapa)
            </Typography>
            
            <Box sx={{ height: '300px', width: '100%', border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden' }}>
                <MapContainer 
                    center={[-1.05458, -80.45445]} // Portoviejo
                    zoom={14} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker setPosicion={setCoords} setDireccion={setDireccion} />
                </MapContainer>
            </Box>
            
            {coords && (
                <Typography variant="caption" color="text.secondary">
                    GPS Seleccionado: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </Typography>
            )}
          </Box>

          <TextField
            label="Referencia escrita (Dirección)"
            fullWidth
            value={direccion} onChange={(e) => setDireccion(e.target.value)}
            helperText="Ej: Casa esquinera color verde, frente al parque."
          />

          <TextField
            label="Descripción Detallada"
            multiline rows={2} fullWidth
            value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
          />

          <Button
            variant="outlined" component="label" startIcon={<PhotoCamera />}
            sx={{ alignSelf: 'start' }}
          >
            Subir Foto Referencia
            <input type="file" hidden accept="image/*" onChange={(e) => setFoto(e.target.files[0])} />
          </Button>

          <Button type="submit" variant="contained" size="large" sx={{ mt: 2 }}>
            Generar Orden
          </Button>
        </Box>
      </Paper>

      {/* --- MODAL DE ÉXITO (POP UP BONITO) --- */}
      <Dialog 
        open={showSuccessModal} 
        onClose={handleCloseSuccess}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, textAlign: 'center', p: 2 } }}
      >
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80 }} />
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                  ¡Orden Creada!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                  El trabajo ha sido registrado exitosamente y notificado al equipo.
              </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                color="success" 
                size="large" 
                onClick={handleCloseSuccess}
                sx={{ minWidth: 120, borderRadius: 2 }}
              >
                  Aceptar
              </Button>
          </DialogActions>
      </Dialog>

      {/* MODAL CLIENTE */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Nuevo Cliente</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                <TextField 
                    label="Nombre Completo" fullWidth autoFocus
                    value={nuevoClienteNombre} onChange={(e) => setNuevoClienteNombre(e.target.value)}
                />
                <TextField 
                    label="Correo (Opcional)" fullWidth
                    value={nuevoClienteEmail} onChange={(e) => setNuevoClienteEmail(e.target.value)}
                />
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleCrearCliente}>Guardar Cliente</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}