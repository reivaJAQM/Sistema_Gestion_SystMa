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
import Dashboard from './pages/Dashboard'; // <--- 1. IMPORTAMOS EL DASHBOARD

const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
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
              {/* 2. CAMBIAMOS: Al entrar a la raíz, vamos al Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              
              {/* 3. AGREGAMOS la ruta real */}
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