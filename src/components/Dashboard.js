import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid,
  Paper,
  Typography,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { getCertificates, getCompanyProfile } from '../utils/dataStore';

const Dashboard = ({ materialType }) => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos del usuario actual
        const userData = window.api.getCurrentUser();
        if (!userData) {
          // Si no hay datos de usuario, redireccionar al login
          navigate('/login');
          return;
        }
        setCurrentUser(userData);
        
        // Get company profile from the user data if available, otherwise from the API
        if (userData.company) {
          setCompanyProfile(userData.company);
        } else {
          const profileResult = await window.api.getCompanyProfile();
          if (profileResult.success) {
            setCompanyProfile(profileResult.data);
          }
        }
        
        // Get certificates
        const certificatesResult = await window.api.getCertificates();
        if (certificatesResult.success) {
          // Convert certificates object to array and sort by date
          const certificatesArray = Object.values(certificatesResult.data || {})
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setCertificates(certificatesArray);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Error al cargar los datos del panel. Por favor, inténtelo de nuevo.');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  const handleLogout = async () => {
    try {
      await window.api.logout();
      // Recargar la página para asegurar que los cambios se aplican
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Error al cerrar sesión. Por favor, inténtelo de nuevo.');
      setOpenSnackbar(true);
    }
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
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Panel Principal
        </Typography>
        
        {currentUser && (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1">
              Bienvenido, {currentUser.nombre || currentUser.name || currentUser.username || 'Usuario'}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Box>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* Company Profile Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon color="primary" fontSize="large" sx={{ mr: 2 }} />
                <Typography variant="h5" component="div">
                  Perfil de Empresa
                </Typography>
              </Box>
              
              {companyProfile && Object.keys(companyProfile).length > 0 ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Nombre de Empresa:</strong> {companyProfile.companyName || 'No configurado'}
                  </Typography>
                  {companyProfile.location && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Ubicación:</strong> {companyProfile.location}
                    </Typography>
                  )}
                  {companyProfile.nif && (
                    <Typography variant="body1" gutterBottom>
                      <strong>NIF:</strong> {companyProfile.nif}
                    </Typography>
                  )}
                  {companyProfile.responsableCalidad && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Responsable de Calidad:</strong> {companyProfile.responsableCalidad}
                    </Typography>
                  )}
                  {companyProfile.emailResponsableCalidad && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Email Responsable de Calidad:</strong> {companyProfile.emailResponsableCalidad}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" color="text.secondary" mt={2}>
                    Estos datos se utilizarán en todos los certificados generados.
                  </Typography>
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No se ha configurado el perfil de empresa. Por favor, cree un perfil para continuar.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                startIcon={companyProfile ? <EditIcon /> : <AddIcon />}
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/perfil-empresa')}
              >
                {companyProfile ? 'Ver' : 'Crear'} Perfil
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* User Profile Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon color="primary" fontSize="large" sx={{ mr: 2 }} />
                <Typography variant="h5" component="div">
                  Mi Perfil
                </Typography>
              </Box>
              
              {currentUser ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Nombre:</strong> {currentUser.nombre || currentUser.name || 'No configurado'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Email:</strong> {currentUser.email || 'No configurado'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Rol:</strong> {currentUser.rol_nombre ? 
                      (currentUser.rol_nombre === 'admin' ? 'Administrador' : 
                       currentUser.rol_nombre === 'fabricante' ? 'Fabricante' : 
                       currentUser.rol_nombre === 'consultor' ? 'Consultor' : 
                       currentUser.rol_nombre) : 
                      (currentUser.role === 'admin' ? 'Administrador' : 'Usuario')}
                  </Typography>
                  {currentUser.fabricante_nombre && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Empresa:</strong> {currentUser.fabricante_nombre}
                    </Typography>
                  )}
                </>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No hay información de usuario disponible.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                startIcon={<EditIcon />}
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/configuraciones')}
              >
                Configuración
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Recent Certificates Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DescriptionIcon color="primary" fontSize="large" sx={{ mr: 2 }} />
                <Typography variant="h5" component="div">
                  Certificados Recientes
                </Typography>
              </Box>
              
              {certificates.length > 0 ? (
                certificates.slice(0, 3).map((certificate, index) => (
                  <Box key={certificate.id}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                      <Box>
                        <Typography variant="body1" fontWeight="500">
                          {certificate.materialType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(certificate.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => navigate(`/certificados/${certificate.id}`)}
                      >
                        Ver
                      </Button>
                    </Box>
                    {index < certificates.slice(0, 3).length - 1 && <Divider />}
                  </Box>
                ))
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No se han creado certificados todavía.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                startIcon={<AddIcon />}
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/certificados/nuevo')}
              >
                Crear Certificado
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/certificados')}
              >
                Ver Todos
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Quick Actions Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Acciones Rápidas
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {materialType === 'aguja' ? (
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/agujas/nuevo-certificado')}
                >
                  Nuevo Certificado de Agujas
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/certificados/nuevo')}
                >
                  Nuevo Certificado
                </Button>
              )}
              <Button 
                variant="outlined" 
                onClick={() => navigate('/certificados')}
              >
                Gestionar Certificados
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/perfil-empresa')}
              >
                Ver Perfil de Empresa
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
