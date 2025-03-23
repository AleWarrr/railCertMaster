import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  AlertTitle,
} from '@mui/material';
import { fetchApi } from '../utils/api';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Función para inicializar la base de datos
  const initializeDatabase = async () => {
    try {
      setLoading(true);
      
      // Llamar al endpoint para inicializar la base de datos
      const response = await fetchApi('/api/initialize-database', {
        method: 'POST'
      });
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: "Base de datos inicializada correctamente",
          severity: 'success',
        });
      } else {
        throw new Error(response.error || "Error al inicializar la base de datos");
      }
    } catch (error) {
      console.error("Error inicializando la base de datos:", error);
      setSnackbar({
        open: true,
        message: `Error al inicializar la base de datos: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Configuraciones
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Administración de Base de Datos
            </Typography>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="body1" paragraph>
                Esta sección permite realizar operaciones de administración en la base de datos.
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>Precaución</AlertTitle>
                Algunas de estas operaciones pueden afectar a los datos existentes. Asegúrese de comprender las consecuencias antes de proceder.
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Inicializar Base de Datos
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Crea o actualiza las tablas necesarias para la aplicación. No elimina datos existentes.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={initializeDatabase}
                      disabled={loading}
                    >
                      {loading ? 'Inicializando...' : 'Inicializar Base de Datos'}
                    </Button>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </CardContent>
      </Card>
      
      {/* Snackbar para notificaciones */}
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

export default SettingsPage;
