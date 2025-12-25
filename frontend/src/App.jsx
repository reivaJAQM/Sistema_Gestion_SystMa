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

// Componente para Proteger Rutas
// Si no hay token, te patea al Login
const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: Login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Privadas (necesitan Navbar y Auth) */}
        <Route path="/*" element={
          <RutaPrivada>
            <Navbar /> {/* El Navbar solo se ve si estás logueado */}
            <Routes>
              <Route path="/" element={<Navigate to="/calendario" />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/nueva-orden" element={<CrearOrden />} /> {/* <--- NUEVA RUTA */}
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