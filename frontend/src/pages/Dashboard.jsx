import React, { useEffect, useState, useCallback } from 'react';
import {
    Container, Paper, Typography, Box, CircularProgress,
    Card, CardContent, Divider, Button, Alert, Chip, Avatar, Stack
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Iconos
import AssignmentIcon from '@mui/icons-material/Assignment';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HandymanIcon from '@mui/icons-material/Handyman';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BuildIcon from '@mui/icons-material/Build';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0, pendientes: 0, en_proceso: 0, en_revision: 0, finalizados: 0, solicitudes_insumos: 0
    });
    const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
    const [dataGrafica, setDataGrafica] = useState([]);
    const navigate = useNavigate();

    const usuario = localStorage.getItem('user_name');
    const userRol = localStorage.getItem('user_rol');
    let userId = parseInt(localStorage.getItem('user_id'));

    const fetchData = useCallback(async () => {
        try {
            if (isNaN(userId) || !userId) {
                try {
                    const perfilRes = await api.get('perfil/');
                    if (perfilRes.data.id || perfilRes.data.user_id) {
                        userId = perfilRes.data.id || perfilRes.data.user_id;
                        localStorage.setItem('user_id', userId);
                    }
                } catch (e) {
                    console.error("Error al obtener perfil", e);
                }
            }

            const [{ data }, resSolicitudes] = await Promise.all([
                api.get('ordenes/'),
                api.get('solicitudes-insumos/?estado=PENDIENTE').catch(() => ({ data: [] }))
            ]);

            const total = data.length;
            const pendientes = data.filter(o => o.estado_data?.nombre === 'Pendiente').length;
            const en_proceso = data.filter(o => o.estado_data?.nombre === 'En Progreso').length;
            const finalizados = data.filter(o => o.estado_data?.nombre === 'Finalizado').length;

            let en_revision = 0;
            if (userRol === 'Administrador') {
                en_revision = data.filter(o => o.estado_data?.nombre === 'En Revisión').length;
            } else if (userRol === 'Supervisor') {
                en_revision = data.filter(o =>
                    o.estado_data?.nombre === 'En Revisión' && Number(o.supervisor) === Number(userId)
                ).length;
            }

            let solPendientes = resSolicitudes.data || [];
            if (userRol === 'Supervisor') {
                // Filtrar solo las órdenes donde este usuario es el supervisor asignado
                const misOrdenesIds = new Set(data.filter(o => Number(o.supervisor) === Number(userId)).map(o => o.id));
                solPendientes = solPendientes.filter(s => misOrdenesIds.has(s.orden));
            }
            setSolicitudesPendientes(solPendientes);

            setStats({ total, pendientes, en_proceso, en_revision, finalizados, solicitudes_insumos: solPendientes.length });

            setDataGrafica([
                { name: 'Pendientes', cantidad: pendientes, color: '#9e9e9e' },
                { name: 'En Progreso', cantidad: en_proceso, color: '#1976d2' },
                { name: 'En Revisión', cantidad: en_revision, color: '#ed6c02' },
                { name: 'Finalizados', cantidad: finalizados, color: '#2e7d32' },
            ]);
        } catch (error) {
            console.error("Error cargando dashboard", error);
        } finally {
            setLoading(false);
        }
    }, [userId, userRol]);

    useEffect(() => {
        if (userRol === 'Cliente') {
            navigate('/mis-solicitudes');
            return;
        }
        if (userRol === 'Tecnico') {
            navigate('/calendario');
            return;
        }
        fetchData();
    }, [fetchData, navigate, userRol]);

    const KpiCard = ({ title, value, icon, color, onClick }) => (
        <Card
            sx={{
                height: '100%',
                borderRadius: '24px',
                boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                background: '#ffffff',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                    transform: onClick ? 'translateY(-5px)' : 'none',
                    boxShadow: onClick ? '0px 20px 40px rgba(0,0,0, 0.08)' : '0px 10px 30px rgba(0,0,0, 0.04)'
                }
            }}
            onClick={onClick}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{
                        bgcolor: `${color}15`,
                        p: 1.5, borderRadius: '16px', color: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${color}30`
                    }}>
                        {icon}
                    </Box>
                    {onClick && <MoreVertIcon sx={{ color: '#bdbdbd', fontSize: 20 }} />}
                </Box>

                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#2D3748', letterSpacing: '-0.02em' }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600, mt: 0.5 }}>
                        {title}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );

    if (userRol === 'Tecnico') return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', pb: 4 }}>
            <Container maxWidth="xl" sx={{ pt: 4 }}>

                {/* --- HEADER CON NUEVOS BOTONES --- */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="900" sx={{ color: '#1a202c', letterSpacing: '-0.03em' }}>
                            Hola, {usuario}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: '#718096', mt: 0.5 }}>
                            Resumen de operaciones · {new Date().toLocaleDateString()}
                        </Typography>
                    </Box>

                    {/* Contenedor de Botones de Acción */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained" size="large"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={() => navigate('/nueva-orden')}
                            sx={{
                                borderRadius: '12px', textTransform: 'none', fontWeight: 'bold',
                                background: '#10b981', // Color verde esmeralda
                                '&:hover': { background: '#059669' }
                            }}
                        >
                            Agendar Trabajo
                        </Button>

                        <Button
                            variant="contained" size="large"
                            startIcon={<CalendarMonthIcon />}
                            onClick={() => navigate('/calendario')}
                            sx={{
                                borderRadius: '12px', textTransform: 'none', fontWeight: 'bold',
                                '&:hover': { background: '#0761d1' }
                            }}
                        >
                            Ver Calendario
                        </Button>
                    </Box>
                </Box>

                {/* --- GRID DE KPIS --- */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' },
                    gap: 3, mb: 4
                }}>
                    <KpiCard
                        title="Total Órdenes" value={stats.total} icon={<AssignmentIcon />} color="#5c6bc0"
                        onClick={() => navigate('/todos-los-trabajos')}
                    />
                    <KpiCard
                        title="Pendientes" value={stats.pendientes} icon={<HourglassEmptyIcon />} color="#757575"
                        onClick={() => navigate('/todos-los-trabajos', { state: { filtro: 'Pendiente' } })}
                    />
                    <KpiCard
                        title="En Ejecución" value={stats.en_proceso} icon={<EngineeringIcon />} color="#0070f3"
                        onClick={() => navigate('/todos-los-trabajos', { state: { filtro: 'En Progreso' } })}
                    />
                    <KpiCard
                        title="Por Revisar" value={stats.en_revision} icon={<WarningIcon />} color="#f59e0b"
                        onClick={stats.en_revision > 0 ? () => navigate('/todos-los-trabajos', { state: { filtro: 'En Revisión' } }) : undefined}
                    />
                    <KpiCard
                        title="Finalizados" value={stats.finalizados} icon={<CheckCircleIcon />} color="#10b981"
                        onClick={() => navigate('/todos-los-trabajos', { state: { filtro: 'Finalizado' } })}
                    />
                </Box>

                {/* --- SECCIÓN INFERIOR --- */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>

                    {/* GRÁFICA */}
                    <Paper elevation={0} sx={{
                        p: 3, height: '340px', borderRadius: '24px',
                        boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748' }}>
                                Flujo de Trabajo
                            </Typography>
                        </Box>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataGrafica} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A0AEC0', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A0AEC0' }} />
                                <Tooltip cursor={{ fill: '#F7FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                                <Bar dataKey="cantidad" radius={[6, 6, 6, 6]} barSize={50}>
                                    {dataGrafica.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>

                    {/* CENTRO DE ATENCIÓN */}
                    <Paper elevation={0} sx={{
                        p: 3, 
                        minHeight: '340px',
                        borderRadius: '24px',
                        boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
                        border: '1px solid #f1f5f9',
                        bgcolor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a', fontSize: '1.1rem' }}>
                                Centro de Atención
                            </Typography>
                            {(stats.en_revision > 0 || stats.solicitudes_insumos > 0) ? (
                                <Chip 
                                    label={`${stats.en_revision + stats.solicitudes_insumos} Pendiente${(stats.en_revision + stats.solicitudes_insumos) > 1 ? 's' : ''}`}
                                    size="small"
                                    sx={{ 
                                        bgcolor: '#fef2f2', 
                                        color: '#ef4444', 
                                        fontWeight: 800, 
                                        fontSize: '0.72rem',
                                        borderRadius: '8px',
                                        height: 24
                                    }}
                                />
                            ) : (
                                <Chip 
                                    label="Al día" 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: '#f0fdf4', 
                                        color: '#16a34a', 
                                        fontWeight: 800, 
                                        fontSize: '0.72rem',
                                        borderRadius: '8px',
                                        height: 24
                                    }}
                                />
                            )}
                        </Box>
                        <Divider sx={{ mb: 2.5, borderColor: '#f8fafc' }} />

                        {stats.en_revision === 0 && stats.solicitudes_insumos === 0 ? (
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                <Typography variant="body1" fontWeight="700" color="#334155">
                                    Todo al día
                                </Typography>
                                <Typography variant="caption" color="#94a3b8" textAlign="center" sx={{ maxWidth: 220, mt: 0.5 }}>
                                    No hay solicitudes ni revisiones pendientes.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                                {/* SOLICITUDES DE INSUMOS */}
                                {stats.solicitudes_insumos > 0 && (
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.2}>
                                            <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Solicitudes de Insumos ({stats.solicitudes_insumos})
                                            </Typography>
                                        </Box>

                                        <Stack spacing={1.2}>
                                            {solicitudesPendientes.slice(0, 3).map(sol => (
                                                <Box 
                                                    key={sol.id} 
                                                    onClick={() => navigate(`/trabajo/${sol.orden}`)}
                                                    sx={{ 
                                                        p: 1.8, 
                                                        bgcolor: '#f8fafc', 
                                                        borderRadius: '14px', 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center',
                                                        cursor: 'pointer', 
                                                        border: '1px solid #e2e8f0',
                                                        transition: 'all 0.15s ease',
                                                        '&:hover': { 
                                                            bgcolor: '#ffffff',
                                                            borderColor: '#cbd5e1',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ minWidth: 0, pr: 1 }}>
                                                        <Typography variant="body2" fontWeight="700" sx={{ color: '#0f172a' }} noWrap>
                                                            {sol.cantidad}x {sol.item_nombre}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }} noWrap>
                                                            {sol.solicitado_por_nombre} • Orden #{sol.orden}
                                                        </Typography>
                                                    </Box>
                                                    
                                                    <Button 
                                                        size="small" 
                                                        variant="text" 
                                                        sx={{ 
                                                            textTransform: 'none', 
                                                            py: 0.4, 
                                                            px: 1.4, 
                                                            fontSize: '0.8rem', 
                                                            fontWeight: 800,
                                                            color: '#2563eb',
                                                            borderRadius: '8px',
                                                            bgcolor: '#eff6ff',
                                                            '&:hover': { bgcolor: '#dbeafe' },
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        Atender
                                                    </Button>
                                                </Box>
                                            ))}
                                            {solicitudesPendientes.length > 3 && (
                                                <Typography variant="caption" color="#94a3b8" textAlign="center" sx={{ display: 'block', pt: 0.5 }}>
                                                    + {solicitudesPendientes.length - 3} solicitudes más en campo
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                )}

                                {/* ÓRDENES EN REVISIÓN */}
                                {stats.en_revision > 0 && (
                                    <Box sx={{ pt: stats.solicitudes_insumos > 0 ? 0.5 : 0 }}>
                                        <Box 
                                            onClick={() => navigate('/todos-los-trabajos', { state: { filtro: 'En Revisión' } })}
                                            sx={{
                                                p: 1.8,
                                                bgcolor: '#fffbeb',
                                                borderRadius: '14px',
                                                border: '1px solid #fef3c7',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                '&:hover': { bgcolor: '#fef3c7' }
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="body2" fontWeight="700" sx={{ color: '#92400e' }}>
                                                    {stats.en_revision} {stats.en_revision === 1 ? 'Orden' : 'Órdenes'} por Revisar
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#b45309', display: 'block', mt: 0.2 }}>
                                                    Pendientes de aprobación final
                                                </Typography>
                                            </Box>
                                            <Button 
                                                size="small" 
                                                variant="text" 
                                                sx={{ 
                                                    textTransform: 'none', 
                                                    py: 0.4, 
                                                    px: 1.4, 
                                                    fontSize: '0.8rem', 
                                                    fontWeight: 800,
                                                    color: '#b45309',
                                                    borderRadius: '8px',
                                                    bgcolor: '#fde68a',
                                                    '&:hover': { bgcolor: '#fcd34d' },
                                                    flexShrink: 0
                                                }}
                                            >
                                                Revisar
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
}