import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, TextField, Button, Grid, Paper, Divider, Alert, CircularProgress,
  Avatar, IconButton
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CropIcon from '@mui/icons-material/Crop';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import ImageCropper from '../components/ImageCropper';
import { getMediaUrl } from '../utils/mediaUrl';

export default function Perfil() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      const response = await api.get('perfil/');
      const data = response.data;
      setFormData(prev => ({
        ...prev,
        username: data.username || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || ''
      }));
      if (data.foto_perfil) {
        setFotoPreview(getMediaUrl(data.foto_perfil));
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la información del perfil.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB.');
        return;
      }
      setCropImageSrc(URL.createObjectURL(file));
      setCropOpen(true);
    }
  };

  const handleCropComplete = (file) => {
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleRemoveFoto = async () => {
    try {
      await api.delete('perfil/');
      setFotoPreview(null);
      setFotoFile(null);
      setSuccess('Foto de perfil eliminada.');
    } catch (err) {
      setError('Error al eliminar la foto de perfil.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (formData.password || formData.confirm_password) {
      if (formData.password !== formData.confirm_password) {
        setError('Las contraseñas no coinciden.');
        setSaving(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        setSaving(false);
        return;
      }
    }

    const dataToSend = {
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email
    };

    if (formData.password) {
      dataToSend.password = formData.password;
    }

    try {
      if (fotoFile) {
        const formDataObj = new FormData();
        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key]) formDataObj.append(key, dataToSend[key]);
        });
        formDataObj.append('foto_perfil', fotoFile);

        const response = await api.put('perfil/', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess(response.data.detail || 'Perfil actualizado correctamente.');
        if (response.data.user?.foto_perfil) {
          setFotoPreview(getMediaUrl(response.data.user.foto_perfil));
        }
      } else {
        const response = await api.put('perfil/', dataToSend);
        setSuccess(response.data.detail || 'Perfil actualizado correctamente.');
      }

      setFormData(prev => ({ ...prev, password: '', confirm_password: '' }));
      localStorage.setItem('user_name', dataToSend.username);
      if (fotoPreview && fotoPreview.startsWith('blob:')) {
        setFotoFile(null);
      }
      window.dispatchEvent(new Event('fotoPerfilChanged'));
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', pb: 4 }}>
      <Container maxWidth="md" sx={{ pt: 4 }}>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#1a202c', letterSpacing: '-0.03em' }}>
            Mi Perfil
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#718096', mt: 0.5 }}>
            Actualiza tu información personal, foto de perfil o cambia tu contraseña.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          {/* FOTO DE PERFIL */}
          <Paper elevation={0} sx={{ 
            p: 4, borderRadius: '24px', mb: 3,
            boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={fotoPreview || undefined}
                  sx={{ 
                    width: 100, height: 100, 
                    border: '4px solid #EBF5FF',
                    boxShadow: '0 4px 12px rgba(0, 112, 243, 0.15)'
                  }}
                >
                  <Typography variant="h3" fontWeight="800" color="#0070f3">
                    {(formData.first_name || formData.username)?.charAt(0).toUpperCase()}
                  </Typography>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  id="foto-perfil-input"
                  hidden
                  onChange={handleFotoChange}
                />
                <label htmlFor="foto-perfil-input">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute', bottom: -4, right: -4,
                      bgcolor: '#0070f3', color: '#fff',
                      '&:hover': { bgcolor: '#0761d1' },
                      boxShadow: '0 2px 8px rgba(0, 112, 243, 0.3)',
                      width: 32, height: 32, p: 0
                    }}
                  >
                    <PhotoCameraIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </label>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="700" sx={{ color: '#2D3748' }}>
                  Foto de Perfil
                </Typography>
                <Typography variant="body2" sx={{ color: '#A0AEC0', mb: 1 }}>
                  Haz clic en el ícono de cámara para subir una imagen. Máximo 5MB.
                </Typography>
                {fotoPreview && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleRemoveFoto}
                      sx={{ color: '#ef4444', textTransform: 'none', fontWeight: 600 }}
                    >
                      Eliminar
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>

          {/* DATOS PERSONALES */}
          <Paper elevation={0} sx={{ 
            p: 4, borderRadius: '24px', mb: 3,
            boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}>
            <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 3 }}>
              Datos Personales
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de Usuario"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombres"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellidos"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* CONTRASEÑA */}
          <Paper elevation={0} sx={{ 
            p: 4, borderRadius: '24px', mb: 3,
            boxShadow: '0px 10px 30px rgba(0,0,0, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}>
            <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748', mb: 1 }}>
              Cambiar Contraseña
            </Typography>
            <Typography variant="body2" sx={{ color: '#A0AEC0', mb: 3 }}>
              Deja los campos en blanco si no deseas cambiar tu contraseña.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={saving}
              sx={{ 
                borderRadius: '12px', textTransform: 'none', fontWeight: 'bold',
                background: '#10b981', '&:hover': { background: '#059669' },
                minWidth: 200
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar Cambios'}
            </Button>
          </Box>
        </form>

        <ImageCropper
          open={cropOpen}
          imageSrc={cropImageSrc}
          onClose={() => setCropOpen(false)}
          onCropComplete={handleCropComplete}
        />
      </Container>
    </Box>
  );
}
