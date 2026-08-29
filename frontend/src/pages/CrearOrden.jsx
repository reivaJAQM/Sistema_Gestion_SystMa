import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Paper, TextField, Button, Typography, Box,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Stack, Autocomplete, MenuItem, CircularProgress,
    Chip, Divider, Card, CardContent, InputAdornment
} from '@mui/material';
import {
    IconCamera, IconCirclePlus, IconMapPin, IconCircleCheck,
    IconTools, IconPackage, IconTrash, IconPlus, IconMinus
} from '@tabler/icons-react';
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
function LocationMarker({ setPosicion }) {
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
    const [listaHerramientas, setListaHerramientas] = useState([]);
    const [listaMateriales, setListaMateriales] = useState([]);

    // Inventario asignado en la orden
    const [herramientasSeleccionadas, setHerramientasSeleccionadas] = useState([]);
    const [herramientaActualId, setHerramientaActualId] = useState('');
    const [cantidadHerramientaActual, setCantidadHerramientaActual] = useState(1);
    const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
    const [materialActualId, setMaterialActualId] = useState('');
    const [cantidadMaterialActual, setCantidadMaterialActual] = useState(1);

    const formatearStockTexto = (valor, unidad) => {
        const num = Number(valor) || 0;
        const numFormateado = Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
        let unidadTexto = unidad ? unidad.trim() : '';
        if (unidadTexto.toLowerCase() === 'unidad' || unidadTexto.toLowerCase() === 'unidades') {
            unidadTexto = numFormateado === 1 ? 'Unidad' : 'Unidades';
        }
        return { num: numFormateado, unidad: unidadTexto };
    };

    // Modales
    const [openModal, setOpenModal] = useState(false); // Modal Cliente
    const [showSuccessModal, setShowSuccessModal] = useState(false); // Modal Éxito
    const [loading, setLoading] = useState(false); // Estado de carga

    const [nuevoClienteData, setNuevoClienteData] = useState({ first_name: '', last_name: '', cedula: '', telefono: '', email: '' });
    const [nuevoClienteError, setNuevoClienteError] = useState('');
    const [nuevoClienteLoading, setNuevoClienteLoading] = useState(false);

    // Generar Horarios
    const horariosDisponibles = [];
    for (let i = 7; i <= 20; i++) {
        const horaStr = i < 10 ? `0${i}:00` : `${i}:00`;
        horariosDisponibles.push(horaStr);
    }

    const cargarDatos = useCallback(async () => {
        try {
            const promesas = [
                api.get('clientes/'),
                api.get('tecnicos/'),
                api.get('inventario/?tipo=HERRAMIENTA'),
                api.get('inventario/?tipo=MATERIAL')
            ];
            if (userRol === 'Administrador') promesas.push(api.get('supervisores/'));

            const respuestas = await Promise.all(promesas);
            setListaClientes(respuestas[0].data);
            setListaTecnicos(respuestas[1].data);
            setListaHerramientas(respuestas[2].data);
            setListaMateriales(respuestas[3].data);
            if (userRol === 'Administrador') setListaSupervisores(respuestas[4].data);
        } catch (error) {
            console.error('Error cargando datos para crear orden:', error);
        }
    }, [userRol]);

    useEffect(() => {
        if (userRol === 'Cliente' || userRol === 'Tecnico') {
            navigate('/mis-solicitudes');
            return;
        }
        cargarDatos();
    }, [cargarDatos, navigate, userRol]);

    const handleAgregarHerramienta = () => {
        if (!herramientaActualId) return alert("Selecciona una herramienta.");
        const cant = parseInt(cantidadHerramientaActual, 10);
        if (!cant || cant <= 0) return alert("Ingresa una cantidad válida.");

        const herrObj = listaHerramientas.find(h => h.id === herramientaActualId);
        if (!herrObj) return;

        const maxDisponible = Math.round(herrObj.stock_actual);
        if (cant > maxDisponible) {
            return alert(`Solo hay ${maxDisponible} unidad(es) disponible(s) de ${herrObj.nombre}.`);
        }

        if (herramientasSeleccionadas.some(h => h.id === herramientaActualId)) {
            return alert("Esta herramienta ya fue agregada a la lista. Si necesitas cambiar la cantidad, elimínala de la lista y vuelve a agregarla.");
        }

        setHerramientasSeleccionadas([
            ...herramientasSeleccionadas,
            {
                id: herrObj.id,
                nombre: herrObj.nombre,
                cantidad: cant,
                unidad_medida: herrObj.unidad_medida || 'Unidad'
            }
        ]);
        setHerramientaActualId('');
        setCantidadHerramientaActual(1);
    };

    const handleQuitarHerramienta = (herramientaId) => {
        setHerramientasSeleccionadas(herramientasSeleccionadas.filter(h => h.id !== herramientaId));
    };

    const handleAgregarMaterial = () => {
        if (!materialActualId) return alert("Selecciona un material.");
        const cant = Number(cantidadMaterialActual);
        if (!cant || cant <= 0) return alert("Ingresa una cantidad válida.");

        const matObj = listaMateriales.find(m => m.id === materialActualId);
        if (!matObj) return;

        const maxDisp = Number(matObj.stock_actual) || 0;
        if (cant > maxDisp) {
            const info = formatearStockTexto(maxDisp, matObj.unidad_medida);
            return alert(`Solo hay ${info.num} ${info.unidad} disponible(s) en almacén de ${matObj.nombre}.`);
        }

        if (materialesSeleccionados.some(m => m.material === materialActualId)) {
            alert("Este material ya fue agregado a la lista. Si necesitas cambiar la cantidad, elimínalo de la lista y vuelve a agregarlo.");
            return;
        }

        setMaterialesSeleccionados([
            ...materialesSeleccionados,
            {
                material: matObj.id,
                nombre: matObj.nombre,
                codigo: matObj.codigo,
                unidad_medida: matObj.unidad_medida,
                cantidad_estimada: cant
            }
        ]);
        setMaterialActualId('');
        setCantidadMaterialActual(1);
    };

    const handleQuitarMaterial = (materialId) => {
        setMaterialesSeleccionados(materialesSeleccionados.filter(m => m.material !== materialId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
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
            const resOrden = await api.post('ordenes/', formData);
            const nuevaOrdenId = resOrden.data.id;

            // 1. Asignar Herramientas
            if (herramientasSeleccionadas.length > 0) {
                const promesasHerramientas = herramientasSeleccionadas.map(h =>
                    api.post('orden-herramientas/', {
                        orden: nuevaOrdenId,
                        herramienta: h.id,
                        cantidad: h.cantidad
                    })
                );
                await Promise.all(promesasHerramientas);
            }

            // 2. Asignar Materiales Estimados
            if (materialesSeleccionados.length > 0) {
                const promesasMateriales = materialesSeleccionados.map(m =>
                    api.post('orden-materiales/', {
                        orden: nuevaOrdenId,
                        material: m.material,
                        cantidad_estimada: m.cantidad_estimada,
                        cantidad_real: 0
                    })
                );
                await Promise.all(promesasMateriales);
            }

            setShowSuccessModal(true);

        } catch (error) {
            console.error(error);
            if (error.response && error.response.data) {
                alert(`Error: ${JSON.stringify(error.response.data)}`);
            } else {
                alert('Error al crear la orden.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- FUNCIÓN PARA CERRAR Y REDIRIGIR ---
    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        navigate('/calendario');
    };

    const handleCrearCliente = async () => {
        if (!nuevoClienteData.first_name.trim() || !nuevoClienteData.last_name.trim()) {
            setNuevoClienteError("El nombre y apellido son requeridos.");
            return;
        }
        if (!nuevoClienteData.cedula.trim()) {
            setNuevoClienteError("El número de cédula es obligatorio.");
            return;
        }
        if (!nuevoClienteData.email.trim()) {
            setNuevoClienteError("El correo electrónico es obligatorio.");
            return;
        }

        setNuevoClienteLoading(true);
        setNuevoClienteError('');
        try {
            const response = await api.post('clientes/', nuevoClienteData);
            const resClientes = await api.get('clientes/');
            setListaClientes(resClientes.data);
            setClienteId(response.data.id);
            setOpenModal(false);
            setNuevoClienteData({ first_name: '', last_name: '', cedula: '', telefono: '', email: '' });
        } catch (error) {
            const detail = error.response?.data;
            if (typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                setNuevoClienteError(msgs);
            } else {
                setNuevoClienteError("Error al registrar cliente.");
            }
        } finally {
            setNuevoClienteLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Crear Orden de Trabajo
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
                            getOptionLabel={(option) => {
                                const nombre = `${option.first_name || ''} ${option.last_name || ''}`.trim();
                                const doc = option.cedula || option.username;
                                return nombre ? `${nombre} (C.I. ${doc})` : doc;
                            }}
                            value={listaClientes.find(c => c.id === clienteId) || null}
                            onChange={(event, newValue) => setClienteId(newValue ? newValue.id : '')}
                            renderInput={(params) => <TextField {...params} label="Cliente" required inputProps={{ ...params.inputProps, autoComplete: 'off' }} />}
                        />
                        <IconButton color="primary" onClick={() => { setNuevoClienteError(''); setOpenModal(true); }}>
                            <IconCirclePlus size={32} stroke={1.75} />
                        </IconButton>
                    </Box>

                    {/* TÉCNICO / SUPERVISOR */}
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Autocomplete
                            sx={{ flex: 1 }}
                            options={listaTecnicos}
                            getOptionLabel={(option) => {
                                const nombre = `${option.first_name || ''} ${option.last_name || ''}`.trim();
                                const doc = option.cedula || option.username;
                                return nombre ? `${nombre} (C.I. ${doc})` : doc;
                            }}
                            value={listaTecnicos.find(t => t.id === tecnicoId) || null}
                            onChange={(event, newValue) => setTecnicoId(newValue ? newValue.id : null)}
                            renderInput={(params) => <TextField {...params} label="Técnico Responsable" required inputProps={{ ...params.inputProps, autoComplete: 'off' }} />}
                        />
                        {userRol === 'Administrador' && (
                            <Autocomplete
                                sx={{ flex: 1 }}
                                options={listaSupervisores}
                                getOptionLabel={(option) => {
                                    const nombre = `${option.first_name || ''} ${option.last_name || ''}`.trim();
                                    const doc = option.cedula || option.username;
                                    return nombre ? `${nombre} (C.I. ${doc})` : doc;
                                }}
                                value={listaSupervisores.find(s => s.id === supervisorId) || null}
                                onChange={(event, newValue) => setSupervisorId(newValue ? newValue.id : null)}
                                renderInput={(params) => <TextField {...params} label="Asignar Supervisor" inputProps={{ ...params.inputProps, autoComplete: 'off' }} />}
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
                            <IconMapPin size={18} stroke={1.75} color="#ef4444" /> Ubicación Exacta (Selecciona en el mapa)
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
                        label="Referencia"
                        fullWidth
                        value={direccion} onChange={(e) => setDireccion(e.target.value)}
                    />

                    <TextField
                        label="Descripción Detallada"
                        multiline rows={2} fullWidth
                        value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                    />

                    {/* ==================================================================== */}
                    {/* SECCIÓN: HERRAMIENTAS Y MATERIALES ASIGNADOS */}
                    {/* ==================================================================== */}
                    <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', p: 1 }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconTools size={20} stroke={1.75} color="#2563eb" /> Herramientas y Materiales para el Trabajo
                            </Typography>
                            <Divider />

                            {/* 1. SELECCIÓN DE HERRAMIENTAS */}
                            {(() => {
                                const herrObj = listaHerramientas.find(h => h.id === herramientaActualId);
                                const maxHerrDisp = herrObj ? Math.round(herrObj.stock_actual) : 999;

                                return (
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold" color="#475569" sx={{ mb: 1 }}>
                                            Herramientas / Equipos Retornables:
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                                            <TextField
                                                select
                                                label="Seleccionar Herramienta"
                                                size="small"
                                                fullWidth
                                                value={herramientaActualId}
                                                onChange={(e) => {
                                                    setHerramientaActualId(e.target.value);
                                                    setCantidadHerramientaActual(1);
                                                }}
                                            >
                                                {listaHerramientas.map((h) => {
                                                    const disponibles = Math.round(h.stock_actual);
                                                    return (
                                                        <MenuItem key={h.id} value={h.id} disabled={disponibles <= 0}>
                                                            {h.nombre} (Disponibles: {disponibles})
                                                        </MenuItem>
                                                    );
                                                })}
                                            </TextField>

                                            <TextField
                                                label="Cantidad"
                                                type="number"
                                                size="small"
                                                sx={{ width: { xs: '100%', sm: '175px' }, minWidth: '165px' }}
                                                value={cantidadHerramientaActual}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (isNaN(val) || val < 1) {
                                                        setCantidadHerramientaActual(1);
                                                    } else if (herrObj && val > maxHerrDisp) {
                                                        setCantidadHerramientaActual(maxHerrDisp);
                                                    } else {
                                                        setCantidadHerramientaActual(val);
                                                    }
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setCantidadHerramientaActual(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                                                                disabled={Number(cantidadHerramientaActual) <= 1}
                                                                sx={{ p: 0.5, color: '#64748b', '&:hover': { color: '#1e293b' } }}
                                                            >
                                                                <IconMinus size={16} stroke={2} />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setCantidadHerramientaActual(prev => Math.min(maxHerrDisp, (parseInt(prev, 10) || 0) + 1))}
                                                                disabled={!herramientaActualId || Number(cantidadHerramientaActual) >= maxHerrDisp}
                                                                sx={{ p: 0.5, color: '#2563eb', '&:hover': { color: '#1d4ed8' } }}
                                                            >
                                                                <IconPlus size={16} stroke={2} />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                    inputProps: {
                                                        min: 1,
                                                        max: maxHerrDisp,
                                                        step: 1,
                                                        style: { textAlign: 'center', fontWeight: 'bold', padding: '8.5px 2px' }
                                                    }
                                                }}
                                                helperText={herrObj ? `Máx: ${maxHerrDisp}` : ''}
                                            />

                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="medium"
                                                startIcon={<IconPlus size={18} stroke={2} />}
                                                onClick={handleAgregarHerramienta}
                                                sx={{ minWidth: '120px', borderRadius: 2, textTransform: 'none', fontWeight: 'bold', height: 40 }}
                                            >
                                                Agregar
                                            </Button>
                                        </Box>

                                        {/* Lista de Herramientas Agregadas */}
                                        {herramientasSeleccionadas.length > 0 && (
                                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {herramientasSeleccionadas.map((item) => (
                                                    <Box
                                                        key={item.id}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            bgcolor: '#ffffff',
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            border: '1px solid #e2e8f0'
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <IconTools size={18} stroke={1.75} color="#2563eb" />
                                                            <Typography variant="body2" fontWeight="bold" color="#1e293b">
                                                                {item.nombre}
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip
                                                                size="small"
                                                                label={`${item.cantidad} ${item.cantidad > 1 ? 'Unidades' : 'Unidad'}`}
                                                                color="primary"
                                                                sx={{ fontWeight: 'bold' }}
                                                            />
                                                            <IconButton size="small" color="error" onClick={() => handleQuitarHerramienta(item.id)}>
                                                                <IconTrash size={18} stroke={1.75} />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })()}

                            {/* 2. SELECCIÓN DE MATERIALES / CONSUMIBLES */}
                            {(() => {
                                const matObj = listaMateriales.find(m => m.id === materialActualId);
                                const maxMatDisp = matObj ? Number(matObj.stock_actual) || 0 : 999999;

                                return (
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold" color="#475569" sx={{ mb: 1 }}>
                                            Materiales e Insumos Estimados:
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                                            <TextField
                                                select
                                                label="Seleccionar Material"
                                                size="small"
                                                fullWidth
                                                value={materialActualId}
                                                onChange={(e) => {
                                                    setMaterialActualId(e.target.value);
                                                    setCantidadMaterialActual(1);
                                                }}
                                            >
                                                {listaMateriales.map((m) => {
                                                    const info = formatearStockTexto(m.stock_actual, m.unidad_medida);
                                                    return (
                                                        <MenuItem key={m.id} value={m.id} disabled={info.num <= 0}>
                                                            {m.nombre} (Stock: {info.num} {info.unidad})
                                                        </MenuItem>
                                                    );
                                                })}
                                            </TextField>

                                            <TextField
                                                label="Cantidad"
                                                type="number"
                                                size="small"
                                                sx={{ width: { xs: '100%', sm: '175px' }, minWidth: '165px' }}
                                                value={cantidadMaterialActual}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (isNaN(val) || val < 1) {
                                                        setCantidadMaterialActual(1);
                                                    } else if (matObj && val > maxMatDisp) {
                                                        setCantidadMaterialActual(maxMatDisp);
                                                    } else {
                                                        setCantidadMaterialActual(val);
                                                    }
                                                }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setCantidadMaterialActual(prev => Math.max(1, (Number(prev) || 1) - 1))}
                                                                disabled={Number(cantidadMaterialActual) <= 1}
                                                                sx={{ p: 0.5, color: '#64748b', '&:hover': { color: '#1e293b' } }}
                                                            >
                                                                <IconMinus size={16} stroke={2} />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setCantidadMaterialActual(prev => Math.min(maxMatDisp, (Number(prev) || 0) + 1))}
                                                                disabled={!materialActualId || Number(cantidadMaterialActual) >= maxMatDisp}
                                                                sx={{ p: 0.5, color: '#0284c7', '&:hover': { color: '#0369a1' } }}
                                                            >
                                                                <IconPlus size={16} stroke={2} />
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                    inputProps: {
                                                        min: 1,
                                                        max: maxMatDisp,
                                                        step: 1,
                                                        style: { textAlign: 'center', fontWeight: 'bold', padding: '8.5px 2px' }
                                                    }
                                                }}
                                                helperText={matObj ? (() => {
                                                    const info = formatearStockTexto(matObj.stock_actual, matObj.unidad_medida);
                                                    return `Máx: ${info.num} ${info.unidad}`;
                                                })() : ''}
                                            />

                                    <Button
                                        variant="contained"
                                        color="info"
                                        size="medium"
                                        startIcon={<IconPlus size={18} stroke={2} />}
                                        onClick={handleAgregarMaterial}
                                        sx={{ minWidth: '120px', borderRadius: 2, textTransform: 'none', fontWeight: 'bold', height: 40 }}
                                    >
                                        Agregar
                                    </Button>
                                </Box>

                                        {/* Lista de Materiales ya Agregados */}
                                        {materialesSeleccionados.length > 0 && (
                                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {materialesSeleccionados.map((item) => (
                                                    <Box
                                                        key={item.material}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            bgcolor: '#ffffff',
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            border: '1px solid #e2e8f0'
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <IconPackage size={18} stroke={1.75} color="#64748b" />
                                                            <Typography variant="body2" fontWeight="bold" color="#1e293b">
                                                                {item.nombre} <Typography component="span" variant="caption" color="text.secondary">({item.codigo})</Typography>
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip
                                                                size="small"
                                                                label={(() => {
                                                                    const info = formatearStockTexto(item.cantidad_estimada, item.unidad_medida);
                                                                    return `${info.num} ${info.unidad}`;
                                                                })()}
                                                                color="info"
                                                                sx={{ fontWeight: 'bold' }}
                                                            />
                                                            <IconButton size="small" color="error" onClick={() => handleQuitarMaterial(item.material)}>
                                                                <IconTrash size={18} stroke={1.75} />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    {/* --- SECCIÓN DE FOTO MEJORADA CON PREVISUALIZACIÓN --- */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'start' }}>
                        <Button
                            variant={foto ? "contained" : "outlined"}
                            component="label"
                            color={foto ? "success" : "primary"}
                            startIcon={<IconCamera size={20} stroke={1.75} />}
                        >
                            {foto ? "Cambiar Foto" : "Subir Foto Referencia"}
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFoto(e.target.files[0]);
                                    }
                                }}
                            />
                        </Button>

                        {/* PREVISUALIZACIÓN */}
                        {foto && (
                            <Box
                                sx={{
                                    mt: 1,
                                    p: 1,
                                    border: '1px dashed #ccc',
                                    borderRadius: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}
                            >
                                <img
                                    src={URL.createObjectURL(foto)}
                                    alt="Previsualización"
                                    style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px' }}
                                />
                                <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                                    {foto.name}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Button type="submit" variant="contained" size="large" sx={{ mt: 2 }} disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Generar Orden"}
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
                    <IconCircleCheck size={72} stroke={1.5} color="#16a34a" />
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
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Nuevo Cliente</DialogTitle>
                <DialogContent>
                    {nuevoClienteError && (
                        <Alert severity="error" sx={{ mb: 2, mt: 1, borderRadius: 2 }}>
                            {nuevoClienteError}
                        </Alert>
                    )}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Nombre(s)" fullWidth autoFocus required
                            value={nuevoClienteData.first_name} 
                            onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, first_name: e.target.value })}
                        />
                        <TextField
                            label="Apellido(s)" fullWidth required
                            value={nuevoClienteData.last_name} 
                            onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, last_name: e.target.value })}
                        />
                        <TextField
                            label="Cédula / Identificación" fullWidth required
                            value={nuevoClienteData.cedula} 
                            onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, cedula: e.target.value })}
                            helperText="Será su usuario y contraseña provisional"
                        />
                        <TextField
                            label="Teléfono de Contacto" fullWidth
                            value={nuevoClienteData.telefono} 
                            onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, telefono: e.target.value })}
                        />
                        <TextField
                            label="Correo Electrónico" fullWidth required type="email"
                            value={nuevoClienteData.email} 
                            onChange={(e) => setNuevoClienteData({ ...nuevoClienteData, email: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)} disabled={nuevoClienteLoading}>Cancelar</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCrearCliente}
                        disabled={nuevoClienteLoading}
                        sx={{ bgcolor: '#0288d1', '&:hover': { bgcolor: '#01579b' } }}
                    >
                        {nuevoClienteLoading ? <CircularProgress size={20} color="inherit" /> : 'Guardar Cliente'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}