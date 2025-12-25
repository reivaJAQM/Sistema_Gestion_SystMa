import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Box, Chip, IconButton, 
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider 
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

// Iconos
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard'; 
import AddCircleIcon from '@mui/icons-material/AddCircle'; 
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Para Técnicos
import GroupAddIcon from '@mui/icons-material/GroupAdd'; // Para Admins
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; // Para Supervisores

export default function Navbar() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false); 

  // Datos del usuario recuperados del localStorage
  const usuario = localStorage.getItem('user_name');
  const rol = localStorage.getItem('user_rol');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // El contenido del menú lateral
  const list = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary">
          Menú
        </Typography>
        <IconButton onClick={toggleDrawer(false)}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      
      <List>
        {/* --- OPCIÓN COMÚN: PANEL DE CONTROL (CALENDARIO) --- */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/calendario">
            <ListItemIcon>
              <DashboardIcon color="primary"/>
            </ListItemIcon>
            <ListItemText primary="Panel de Control" />
          </ListItemButton>
        </ListItem>

        {/* --- SECCIÓN TÉCNICO: MIS TRABAJOS --- */}
        {rol === 'Tecnico' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/mis-trabajos">
              <ListItemIcon>
                <AssignmentIcon color="warning" />
              </ListItemIcon>
              <ListItemText primary="Mis Trabajos" />
            </ListItemButton>
          </ListItem>
        )}

        {/* --- SECCIÓN SUPERVISOR: MIS SUPERVISIONES (NUEVO) --- */}
        {rol === 'Supervisor' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/panel-supervisor">
              <ListItemIcon>
                <AssignmentIndIcon color="info" /> {/* Color azul claro/info */}
              </ListItemIcon>
              <ListItemText primary="Mis Supervisiones" />
            </ListItemButton>
          </ListItem>
        )}

        {/* --- OPCIÓN COMÚN: NUEVA ORDEN --- */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/nueva-orden">
            <ListItemIcon>
              <AddCircleIcon color="secondary"/>
            </ListItemIcon>
            <ListItemText primary="Nueva Orden" />
          </ListItemButton>
        </ListItem>

        {/* --- SECCIÓN ADMINISTRADOR: GESTIONAR PERSONAL --- */}
        {rol === 'Administrador' && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/usuarios">
              <ListItemIcon>
                <GroupAddIcon color="success"/>
              </ListItemIcon>
              <ListItemText primary="Gestionar Personal" />
            </ListItemButton>
          </ListItem>
        )}
      </List>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon color="error"/>
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" sx={{ color: 'error.main' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestión SystMa
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {usuario ? (
                <Chip 
                    icon={<AccountCircleIcon />} 
                    label={`${usuario} (${rol})`} 
                    color="secondary" 
                    variant="filled"
                    sx={{ color: 'white', fontWeight: 'bold' }}
                />
            ) : null}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left" 
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {list()}
      </Drawer>
    </>
  );
}