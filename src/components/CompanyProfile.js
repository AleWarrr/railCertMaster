import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Paper
} from '@mui/material';
import { Save as SaveIcon, Upload as UploadIcon } from '@mui/icons-material';

const CompanyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [logoPreview, setLogoPreview] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      website: '',
      registrationNumber: '',
      taxId: '',
      logoBase64: ''
    }
  });

  useEffect(() => {
    const loadCompanyProfile = async () => {
      try {
        // Verificar si hay un usuario logueado y obtener sus datos
        const userData = window.api.getCurrentUser();
        setCurrentUser(userData);
        
        // Determinar si el formulario debe ser de solo lectura
        // Solo los administradores pueden editar el perfil de la empresa
        if (userData && userData.role !== 'admin') {
          setIsReadOnly(true);
        }
        
        // Cargar el perfil de la empresa
        const result = await window.api.getCompanyProfile();
        if (result.success && result.data) {
          // Set form values from stored profile
          Object.keys(result.data).forEach(key => {
            setValue(key, result.data[key] || '');
          });
          
          // Set logo preview if available
          if (result.data.logoBase64) {
            setLogoPreview(result.data.logoBase64);
          }
        }
      } catch (error) {
        console.error('Error loading company profile:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los datos del perfil de empresa.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadCompanyProfile();
  }, [setValue]);

  const handleLogoUpload = (event) => {
    if (isReadOnly) return;
    
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setValue('logoBase64', base64);
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    if (isReadOnly) return;
    
    try {
      setSaving(true);
      const result = await window.api.saveCompanyProfile(data);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: '¡Perfil de empresa guardado correctamente!',
          severity: 'success'
        });
      } else {
        throw new Error(result.error || 'Error al guardar el perfil');
      }
    } catch (error) {
      console.error('Error saving company profile:', error);
      setSnackbar({
        open: true,
        message: `Error al guardar el perfil: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Perfil de Empresa
      </Typography>
      
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Los datos del perfil de empresa solo pueden ser modificados por un administrador.
        </Alert>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información de la Empresa
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="companyName"
                      control={control}
                      rules={{ required: 'El nombre de la empresa es obligatorio' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Nombre de la Empresa"
                          variant="outlined"
                          error={!!errors.companyName}
                          helperText={errors.companyName?.message}
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="contactName"
                      control={control}
                      rules={{ required: 'El nombre de contacto es obligatorio' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Nombre de Contacto"
                          variant="outlined"
                          error={!!errors.contactName}
                          helperText={errors.contactName?.message}
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="email"
                      control={control}
                      rules={{ 
                        required: 'El email es obligatorio',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email"
                          variant="outlined"
                          error={!!errors.email}
                          helperText={errors.email?.message}
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Teléfono"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="website"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Sitio Web"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Dirección"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="city"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Ciudad"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Provincia"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="zipCode"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Código Postal"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="País"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Información Legal
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="registrationNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Número de Registro"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="taxId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="NIF/CIF"
                          variant="outlined"
                          disabled={isReadOnly}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Logo de la Empresa
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  {logoPreview ? (
                    <Box
                      component="img"
                      src={logoPreview}
                      alt="Logo de la empresa"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        mb: 2
                      }}
                    />
                  ) : (
                    <Paper
                      sx={{
                        width: '100%',
                        height: 200,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'grey.100',
                        mb: 2
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No hay logo
                      </Typography>
                    </Paper>
                  )}
                  
                  {!isReadOnly && (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                      sx={{ mt: 2 }}
                    >
                      Subir Logo
                      <input
                        type="file"
                        hidden
                        onChange={handleLogoUpload}
                        accept="image/*"
                      />
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {!isReadOnly && (
          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </Button>
          </Box>
        )}
      </form>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyProfile;
