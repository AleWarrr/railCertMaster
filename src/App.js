import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CompanyProfile from './components/CompanyProfile';
import MaterialCertificates from './components/MaterialCertificates';
import CertificateForm from './components/CertificateForm';
import PdfPreview from './components/PdfPreview';
import SettingsPage from './components/SettingsPage';
import NeedlesForm from './components/NeedlesForm';
import Login from './components/Login';
import apiAdapter from './utils/apiAdapter';
import { initializeMaterials } from './utils/initMaterials';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuth = apiAdapter.isAuthenticated();
  
  if (!isAuth) {
    return <Navigate to="/login" state={{ error: 'Debes iniciar sesión para acceder a esta página' }} replace />;
  }
  
  return children;
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);

  // Initialize application and attach API adapter to window object
  useEffect(() => {
    const initApp = async () => {
      try {
        // Attach API adapter to window object for global access
        window.api = apiAdapter;
        
        // Inicializar los registros de materiales
        initializeMaterials();
        
        // Load company profile from API if authenticated
        if (apiAdapter.isAuthenticated()) {
          const profileResult = await apiAdapter.getCompanyProfile();
          if (profileResult.success && profileResult.data) {
            setCompanyProfile(profileResult.data);
          }
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de Login pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="certificados" element={<Dashboard />} />
          <Route path="certificados/nuevo" element={<CertificateForm />} />
          <Route path="certificados/:id" element={<CertificateForm />} />
          <Route path="agujas" element={<Dashboard materialType="aguja" />} />
          <Route path="agujas/nuevo-certificado" element={<CertificateForm initialMaterialType="aguja" />} />
          <Route path="agujas/nueva" element={<NeedlesForm />} />
          <Route path="agujas/:id" element={<NeedlesForm />} />
          <Route path="perfil-empresa" element={<CompanyProfile />} />
          <Route path="configuraciones" element={<SettingsPage />} />
        </Route>
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
