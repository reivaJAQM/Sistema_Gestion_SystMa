import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, TextField, Button, Typography, Box, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  IconButton, Stack, Autocomplete 
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function CrearOrden() {
  const navigate = useNavigate();
  const userRol = localStorage.getItem('user_rol'); // Obtenemos el rol
  
  // Estados del Formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  
  // Estados de Selección (IDs)
  const [clienteId, setClienteId] = useState('');
  const [tecnicoId, setTecnicoId] = useState(null);
  const [supervisorId, setSupervisorId] = useState(null); // <--- NUEVO
  const [foto, setFoto] = useState(null);

  // Listas de Datos
  const [listaClientes, setListaClientes] = useState([]);
  const [listaTecnicos, setListaTecnicos] = useState([]);
  const [listaSupervisores, setListaSupervisores] = useState([]); // <--- NUEVO

  // Estados del Modal (Nuevo Cliente)
  const [openModal, setOpenModal] = useState(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [nuevoClienteEmail, setNuevoClienteEmail] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
        const promesas = [
            api.get('clientes/'),
            api.get('tecnicos/')
        ];
        
        // Solo cargamos supervisores si es Admin
        if (userRol === 'Administrador') {
            promesas.push(api.get('supervisores/'));
        }

        const respuestas = await Promise.all(promesas);
        
        setListaClientes(respuestas[0].data);
        setListaTecnicos(respuestas[1].data);
        
        if (userRol === 'Administrador') {
            setListaSupervisores(respuestas[2].data);
        }

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
    formData.append('estado', 1); // Pendiente
    
    if (tecnicoId) formData.append('tecnico', tecnicoId);
    if (fechaInicio) formData.append('fecha_inicio', fechaInicio);
    if (foto) formData.append('foto_referencia', foto);

    // Si es Admin y seleccionó supervisor, lo mandamos.
    // Si es Supervisor, el backend lo asigna solo.
    if (userRol === 'Administrador' && supervisorId) {
        formData.append('supervisor', supervisorId);
    }

    try {
      await api.post('ordenes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('¡Orden creada exitosamente!');
      
      // Redirigir según rol
      if (userRol === 'Supervisor') navigate('/panel-supervisor');
      else navigate('/calendario');

    } catch (error) {
      console.error(error);
      alert('Error al crear la orden. Verifica los datos.');
    }
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
        console.error("Error creando cliente", error);
        alert("Error al crear cliente");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{fontWeight: 'bold'}}>
          Crear Orden de Trabajo
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          <TextField
            label="Título del Trabajo"
            placeholder="Ej: Instalación de Red LAN"
            required fullWidth
            value={titulo} onChange={(e) => setTitulo(e.target.value)}
          />

          {/* FILA: CLIENTE */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Autocomplete
                    fullWidth
                    options={listaClientes}
                    getOptionLabel={(option) => option.first_name ? `${option.first_name} (${option.username})` : option.username}
                    value={listaClientes.find(c => c.id === clienteId) || null}
                    onChange={(event, newValue) => setClienteId(newValue ? newValue.id : '')}
                    renderInput={(params) => <TextField {...params} label="Cliente" required />}
                    noOptionsText="No encontrado"
                />
                <IconButton color="primary" onClick={() => setOpenModal(true)}>
                    <AddCircleIcon fontSize="large" />
                </IconButton>
          </Box>

          {/* FILA: TÉCNICO Y SUPERVISOR */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Autocomplete
                sx={{ flex: 1 }}
                options={listaTecnicos}
                getOptionLabel={(option) => option.first_name ? `${option.first_name} (${option.username})` : option.username}
                value={listaTecnicos.find(t => t.id === tecnicoId) || null}
                onChange={(event, newValue) => setTecnicoId(newValue ? newValue.id : null)}
                renderInput={(params) => <TextField {...params} label="Técnico Responsable" required />}
            />

            {/* SOLO EL ADMINISTRADOR PUEDE ELEGIR SUPERVISOR */}
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

          <TextField
              label="Fecha y Hora de Inicio"
              type="datetime-local"
              fullWidth required
              InputLabelProps={{ shrink: true }}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
          />

          <TextField
            label="Dirección / Ubicación"
            fullWidth
            value={direccion} onChange={(e) => setDireccion(e.target.value)}
          />

          <TextField
            label="Descripción Detallada"
            multiline rows={3} fullWidth
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

      {/* MODAL CLIENTE */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Nuevo Cliente Rápido</DialogTitle>
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