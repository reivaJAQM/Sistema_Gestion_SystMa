import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Box, IconButton, 
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Avatar, Menu, MenuItem 
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getMediaUrl } from '../utils/mediaUrl';

// Iconos
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard'; 
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; 
import AddCircleIcon from '@mui/icons-material/AddCircle'; 
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PersonIcon from '@mui/icons-material/Person';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function Navbar() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false); 
  const [anchorEl, setAnchorEl] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(() => {
    const stored = localStorage.getItem('user_foto');
    return stored ? getMediaUrl(stored) : null;
  });
  const openMenu = Boolean(anchorEl);

  const usuario = localStorage.getItem('user_name');
  const rol = localStorage.getItem('user_rol');

  useEffect(() => {
    const fetchFoto = async () => {
      try {
        const { data } = await api.get('perfil/');
        if (data.foto_perfil) {
          const url = getMediaUrl(data.foto_perfil);
          setFotoPerfil(url);
          localStorage.setItem('user_foto', data.foto_perfil);
        }
      } catch (err) {
        console.error('Error al cargar foto de perfil', err);
      }
    };
    if (usuario) fetchFoto();
  }, [usuario]);

  useEffect(() => {
    const handler = () => {
      api.get('perfil/').then(({ data }) => {
        if (data.foto_perfil) {
          const url = getMediaUrl(data.foto_perfil);
          setFotoPerfil(url);
          localStorage.setItem('user_foto', data.foto_perfil);
        } else {
          setFotoPerfil(null);
          localStorage.removeItem('user_foto');
        }
      });
    };
    window.addEventListener('fotoPerfilChanged', handler);
    return () => window.removeEventListener('fotoPerfilChanged', handler);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  const list = () => (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary">Menú</Typography>
        <IconButton onClick={toggleDrawer(false)}><ChevronLeftIcon /></IconButton>
      </Box>
      <Divider />
      
      <List>
        {rol === 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/mis-solicitudes">
              <ListItemIcon><DashboardIcon color="primary"/></ListItemIcon>
              <ListItemText primary="Mis Solicitudes" />
            </ListItemButton>
          </ListItem>
        )}

        {rol !== 'Tecnico' && rol !== 'Cliente' && (
            <ListItem disablePadding>
            <ListItemButton component={Link} to="/dashboard">
                <ListItemIcon><DashboardIcon color="primary"/></ListItemIcon>
                <ListItemText primary="Panel de Administración" />
            </ListItemButton>
            </ListItem>
        )}

        {rol !== 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/calendario">
              <ListItemIcon><CalendarMonthIcon color="info"/></ListItemIcon>
              <ListItemText primary="Agenda Calendario" />
            </ListItemButton>
          </ListItem>
        )}

        {rol === 'Tecnico' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/mis-trabajos">
              <ListItemIcon><AssignmentIcon color="warning" /></ListItemIcon>
              <ListItemText primary="Mis Trabajos" />
            </ListItemButton>
          </ListItem>
        )}

        {rol !== 'Tecnico' && rol !== 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/todos-los-trabajos">
              <ListItemIcon><ListAltIcon color="action" /></ListItemIcon>
              <ListItemText primary="Lista de Trabajos" />
            </ListItemButton>
          </ListItem>
        )}

        {rol !== 'Tecnico' && rol !== 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/nueva-orden">
              <ListItemIcon><AddCircleIcon color="secondary"/></ListItemIcon>
              <ListItemText primary="Nueva Orden" />
            </ListItemButton>
          </ListItem>
        )}

        {(rol === 'Administrador' || rol === 'Supervisor') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/rendimiento">
              <ListItemIcon><BarChartIcon color="primary"/></ListItemIcon>
              <ListItemText primary="Rendimiento Personal" />
            </ListItemButton>
          </ListItem>
        )}

        {(rol === 'Administrador' || rol === 'Supervisor') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/usuarios">
              <ListItemIcon><GroupAddIcon color="success"/></ListItemIcon>
              <ListItemText primary="Personal" />
            </ListItemButton>
          </ListItem>
        )}

        {(rol === 'Administrador' || rol === 'Supervisor') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/clientes">
              <ListItemIcon><PersonIcon color="info"/></ListItemIcon>
              <ListItemText primary="Clientes" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" sx={{ top: 0, zIndex: 1100 }}>
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <Box 
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
            onClick={() => navigate('/dashboard')}
          >
            <img src="/logo.png" alt="Logo" style={{ height: '40px', marginRight: '10px' }} />
            <Typography variant="h6" component="div">Gestión SystMa</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {usuario && (
                <>
                  <IconButton onClick={handleMenuClick} size="small">
                    <Avatar 
                      src={fotoPerfil || undefined} 
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.2)', 
                        color: '#fff', 
                        fontWeight: 'bold', 
                        border: '2px solid rgba(255,255,255,0.3)' 
                      }}
                    >
                        {usuario.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose} onClick={handleMenuClose}>
                    <Box sx={{ px: 2, py: 1.5, textAlign: 'center', bgcolor: '#f5f5f5', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">{usuario}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 'bold' }}>{rol}</Typography>
                    </Box>
                    <Divider />
                    <MenuItem component={Link} to="/perfil" onClick={handleMenuClose}>
                      <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                      Mi Perfil
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                      Cerrar Sesión
                    </MenuItem>
                  </Menu>
                </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {list()}
      </Drawer>
    </>
  );
}