import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Avatar, Menu, MenuItem
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getMediaUrl } from '../utils/mediaUrl';

// Iconos Tabler
import {
  IconMenu2, IconLayoutDashboard, IconCalendar, IconCirclePlus,
  IconLogout, IconUserCircle, IconChevronLeft, IconClipboardList,
  IconUsers, IconUser, IconListCheck, IconChartBar, IconPackages
} from '@tabler/icons-react';

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
        const res = await api.get('usuarios/mi_perfil/');
        if (res.data.foto) {
          const url = getMediaUrl(res.data.foto);
          setFotoPerfil(url);
          localStorage.setItem('user_foto', res.data.foto);
        }
      } catch (err) {
        console.error('Error cargando foto de perfil:', err);
      }
    };
    if (localStorage.getItem('access_token')) {
      fetchFoto();
    }
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMiPerfil = () => {
    handleMenuClose();
    navigate('/perfil');
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.clear();
    window.location.href = '/login';
  };

  const menuList = () => (
    <Box sx={{ width: 280 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
        <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">Menú de Navegación</Typography>
        <IconButton size="small"><IconChevronLeft size={20} /></IconButton>
      </Box>
      <Divider />
      <List>
        {rol === 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/cliente">
              <ListItemIcon><IconLayoutDashboard size={22} color="#2563eb" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Mi Portal" />
            </ListItemButton>
          </ListItem>
        )}

        {rol !== 'Tecnico' && rol !== 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/dashboard">
              <ListItemIcon><IconLayoutDashboard size={22} color="#2563eb" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Panel de Administración" />
            </ListItemButton>
          </ListItem>
        )}

        {rol !== 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/calendario">
              <ListItemIcon><IconCalendar size={22} color="#0284c7" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Agenda Calendario" />
            </ListItemButton>
          </ListItem>
        )}

        {rol === 'Tecnico' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/mis-trabajos">
              <ListItemIcon><IconClipboardList size={22} color="#d97706" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Mis Trabajos" />
            </ListItemButton>
          </ListItem>
        )}

        {rol !== 'Tecnico' && rol !== 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/todos-los-trabajos">
              <ListItemIcon><IconListCheck size={22} color="#475569" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Lista de Trabajos" />
            </ListItemButton>
          </ListItem>
        )}

        {rol !== 'Tecnico' && rol !== 'Cliente' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/nueva-orden">
              <ListItemIcon><IconCirclePlus size={22} color="#9333ea" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Nueva Orden" />
            </ListItemButton>
          </ListItem>
        )}

        {(rol === 'Administrador' || rol === 'Supervisor') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/inventario">
              <ListItemIcon><IconPackages size={22} color="#d97706" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Inventario" />
            </ListItemButton>
          </ListItem>
        )}

        {(rol === 'Administrador' || rol === 'Supervisor') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/rendimiento">
              <ListItemIcon><IconChartBar size={22} color="#2563eb" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Rendimiento Personal" />
            </ListItemButton>
          </ListItem>
        )}

        {(rol === 'Administrador' || rol === 'Supervisor') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/usuarios">
              <ListItemIcon><IconUsers size={22} color="#16a34a" stroke={1.75} /></ListItemIcon>
              <ListItemText primary="Personal" />
            </ListItemButton>
          </ListItem>
        )}

        {(rol === 'Administrador' || rol === 'Supervisor') && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/clientes">
              <ListItemIcon><IconUser size={22} color="#0284c7" stroke={1.75} /></ListItemIcon>
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
            <IconMenu2 size={24} />
          </IconButton>
          <Box
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            <img src="/logo.png" alt="Logo" style={{ height: '40px', marginRight: '10px' }} />
            <Typography variant="h6" component="div">Gestión SystMa</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {usuario} ({rol})
            </Typography>
            <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 1 }}>
              <Avatar
                src={fotoPerfil || undefined}
                alt={usuario || 'Usuario'}
                sx={{ width: 38, height: 38, border: '2px solid #fff' }}
              >
                {!fotoPerfil && (usuario ? usuario.charAt(0).toUpperCase() : <IconUserCircle size={24} />)}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { mt: 1, minWidth: 160 } }}
          >
            <MenuItem onClick={handleMiPerfil}>
              <ListItemIcon><IconUserCircle size={20} /></ListItemIcon>
              Mi Perfil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><IconLogout size={20} color="#dc2626" /></ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {menuList()}
      </Drawer>
    </>
  );
}