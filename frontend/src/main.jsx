import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 1. Importamos las herramientas de tema de Material UI
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// 2. Creamos el tema con la fuente Quicksand
const theme = createTheme({
  typography: {
    fontFamily: '"Quicksand", "Helvetica", "Arial", sans-serif',
    // Aquí puedes personalizar más cosas:
    h1: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' }, // Botones con texto normal (no todo mayúsculas)
  },
  palette: {
    // Ya que estamos, podemos definir un color primario más bonito si quieres
    primary: {
      main: '#1976d2', // Azul estándar (cámbialo si tienes un color de marca)
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Envolvemos la App con el ThemeProvider */}
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Esto normaliza los estilos del navegador */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);