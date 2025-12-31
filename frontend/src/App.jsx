import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Calendario from './pages/Calendario';
import Login from './pages/Login';
import CrearOrden from './pages/CrearOrden';
import MisTrabajos from './pages/MisTrabajos';
import DetalleTrabajo from './pages/DetalleTrabajo';
import GestionUsuarios from './pages/GestionUsuarios';
import Dashboard from './pages/Dashboard';
import ListaTrabajos from './pages/ListaTrabajos';

const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

const RootRedirect = () => {
  const userRol = localStorage.getItem('user_rol');
  if (userRol === 'Tecnico') return <Navigate to="/calendario" />;
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
              <Route path="/" element={<RootRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} /> 
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/nueva-orden" element={<CrearOrden />} />
              <Route path="/mis-trabajos" element={<MisTrabajos />} />
              <Route path="/trabajo/:id" element={<DetalleTrabajo />} />
              <Route path="/usuarios" element={<GestionUsuarios />} />
              <Route path="/todos-los-trabajos" element={<ListaTrabajos />} />
              
              {/* RUTA PanelSupervisor ELIMINADA AQUÍ */}

            </Routes>
          </RutaPrivada>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;