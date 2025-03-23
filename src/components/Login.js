import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Paper,
  CircularProgress,
  Divider
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Comprobar si ya está autenticado
  useEffect(() => {
    if (window.api.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Por favor, introduce usuario y contraseña.');
      setOpenSnackbar(true);
      return;
    }
    
    try {
      setLoading(true);
      const result = await window.api.login({ username, password });
      if (result.success) {
        // Recargar la página para que App.js detecte la autenticación
        window.location.href = '/';
      } else {
        setError(result.error || 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Error al conectar con el servidor. Por favor, inténtalo más tarde.');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  // Demo login para desarrollo
  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      // Simular login con usuario demo
      // En producción, este botón no estaría disponible
      localStorage.setItem('authToken', 'demo-token');
      localStorage.setItem('userData', JSON.stringify({
        id: 'demo',
        username: 'demo',
        name: 'Usuario Demo',
        email: 'demo@ejemplo.com',
        role: 'admin',
        company: {
          companyName: 'Empresa Demo',
          contactName: 'Contacto Demo',
          email: 'contacto@empresademo.com',
          phone: '123456789',
          address: 'Calle Demo, 123',
          city: 'Ciudad Demo',
          state: 'Provincia Demo',
          zipCode: '12345',
          country: 'España',
          registrationNumber: 'REG12345',
          taxId: 'B12345678'
        }
      }));
      
      // Guardar el perfil de empresa en localStorage para que sea accesible
      localStorage.setItem('companyProfile', JSON.stringify({
        companyName: 'Empresa Demo',
        contactName: 'Contacto Demo',
        email: 'contacto@empresademo.com',
        phone: '123456789',
        address: 'Calle Demo, 123',
        city: 'Ciudad Demo',
        state: 'Provincia Demo',
        zipCode: '12345',
        country: 'España',
        registrationNumber: 'REG12345',
        taxId: 'B12345678'
      }));
      
      // Recargar la página para que App.js detecte la autenticación
      window.location.href = '/';
    } catch (error) {
      console.error('Error en login demo:', error);
      setError('Error al iniciar sesión demo.');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}
    >
      <Paper 
        elevation={10} 
        sx={{ 
          width: { xs: '90%', sm: '450px' },
          p: 4,
          borderRadius: 2
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <LockIcon fontSize="large" color="primary" sx={{ mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            RailCertMaster
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Sistema de Gestión de Certificaciones
          </Typography>
        </Box>
        
        <form onSubmit={handleLogin}>
          <TextField
            label="Usuario"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
          
          <TextField
            label="Contraseña"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
          </Button>
        </form>
        
        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            o
          </Typography>
        </Divider>
        
        <Button
          variant="outlined"
          fullWidth
          onClick={handleDemoLogin}
          disabled={loading}
        >
          Demo (Sólo desarrollo)
        </Button>
        
        {location.state?.error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {location.state.error}
          </Alert>
        )}
        
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default Login; 