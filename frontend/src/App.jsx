import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Calendario from './pages/Calendario';
import Login from './pages/Login';
import CrearOrden from './pages/CrearOrden';
import MisTrabajos from './pages/MisTrabajos';
import DetalleTrabajo from './pages/DetalleTrabajo';
import GestionUsuarios from './pages/GestionUsuarios';
import GestionClientes from './pages/GestionClientes';
import Dashboard from './pages/Dashboard';
import ListaTrabajos from './pages/ListaTrabajos';
import RecuperarContrasena from './pages/RecuperarContrasena';
import ResetearContrasena from './pages/ResetearContrasena';
import Perfil from './pages/Perfil';
import DashboardCliente from './pages/DashboardCliente';
import RendimientoPersonal from './pages/RendimientoPersonal';

const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

const RootRedirect = () => {
  const userRol = localStorage.getItem('user_rol');
  if (userRol === 'Cliente') return <Navigate to="/mis-solicitudes" />;
  if (userRol === 'Tecnico') return <Navigate to="/calendario" />;
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas (sin login) */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<RecuperarContrasena />} />
        <Route path="/resetear/:uid/:token" element={<ResetearContrasena />} />

        <Route path="/*" element={
          <RutaPrivada>
            <Navbar />
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} /> 
              <Route path="/mis-solicitudes" element={<DashboardCliente />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/nueva-orden" element={<CrearOrden />} />
              <Route path="/mis-trabajos" element={<MisTrabajos />} />
              <Route path="/trabajo/:id" element={<DetalleTrabajo />} />
              <Route path="/usuarios" element={<GestionUsuarios />} />
              <Route path="/clientes" element={<GestionClientes />} />
              <Route path="/todos-los-trabajos" element={<ListaTrabajos />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/rendimiento" element={<RendimientoPersonal />} />
              
            </Routes>
          </RutaPrivada>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;