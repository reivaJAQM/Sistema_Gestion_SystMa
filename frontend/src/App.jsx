import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Calendario from './pages/Calendario';
import Login from './pages/Login';
import CrearOrden from './pages/CrearOrden';
import MisTrabajos from './pages/MisTrabajos';
import DetalleTrabajo from './pages/DetalleTrabajo';
import GestionUsuarios from './pages/GestionUsuarios';
import PanelSupervisor from './pages/PanelSupervisor';
import Dashboard from './pages/Dashboard';

// Componente para proteger rutas (si no hay token, al login)
const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

// --- NUEVO: COMPONENTE DE REDIRECCIÓN INICIAL ---
// Decide a dónde ir según el rol cuando entras a "/"
const RootRedirect = () => {
  const userRol = localStorage.getItem('user_rol');
  
  if (userRol === 'Tecnico') {
    return <Navigate to="/calendario" />;
  }
  // Por defecto, Admin y Supervisor van al Dashboard
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/*" element={
          <RutaPrivada>
            <Navbar />
            <Routes>
              {/* USAMOS EL NUEVO COMPONENTE AQUÍ */}
              <Route path="/" element={<RootRedirect />} />
              
              <Route path="/dashboard" element={<Dashboard />} /> 
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/nueva-orden" element={<CrearOrden />} />
              <Route path="/mis-trabajos" element={<MisTrabajos />} />
              <Route path="/trabajo/:id" element={<DetalleTrabajo />} />
              <Route path="/usuarios" element={<GestionUsuarios />} />
              <Route path="/panel-supervisor" element={<PanelSupervisor />} />
            </Routes>
          </RutaPrivada>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;