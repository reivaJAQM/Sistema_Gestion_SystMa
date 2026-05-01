import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Cropper from 'react-easy-crop';

function getCroppedImg(imageSrc, crop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.9);
    };
    image.onerror = () => reject(new Error('Failed to load image'));
  });
}

export default function ImageCropper({ open, imageSrc, onClose, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropChange = useCallback((newCrop) => {
    setCrop(newCrop);
  }, []);

  const onCropCompleteHandler = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || saving) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], 'perfil.jpg', { type: 'image/jpeg' });
      onCropComplete(file);
    } catch (err) {
      console.error('Error al recortar imagen:', err);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0px 20px 60px rgba(0,0,0, 0.15)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pb: 1, borderBottom: '1px solid #EDF2F7'
      }}>
        <Typography variant="h6" fontWeight="800" sx={{ color: '#2D3748' }}>
          Recortar Foto de Perfil
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#A0AEC0' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ 
          position: 'relative', 
          height: 400, 
          bgcolor: '#1a202c',
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteHandler}
            cropShape="round"
            showGrid={false}
            zoomSpeed={0.3}
            minZoom={0.5}
            maxZoom={3}
          />
        </Box>

        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" sx={{ color: '#718096', fontWeight: 600, mb: 1 }}>
            Zoom
          </Typography>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0070f3' }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ 
            borderRadius: '12px', textTransform: 'none', fontWeight: 700,
            background: '#10b981', '&:hover': { background: '#059669' },
            minWidth: 140
          }}
        >
          {saving ? 'Procesando...' : 'Guardar Recorte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
