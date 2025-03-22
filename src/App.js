import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CompanyProfile from './components/CompanyProfile';
import MaterialCertificates from './components/MaterialCertificates';
import CertificateForm from './components/CertificateForm';
import PdfPreview from './components/PdfPreview';
import SettingsPage from './components/SettingsPage';
import apiAdapter from './utils/apiAdapter';

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
        
        // Load company profile from API
        const profileResult = await apiAdapter.getCompanyProfile();
        if (profileResult.success && profileResult.data) {
          setCompanyProfile(profileResult.data);
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
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/certificates" element={<MaterialCertificates />} />
          <Route path="/certificates/new" element={<CertificateForm />} />
          <Route path="/certificates/edit/:id" element={<CertificateForm />} />
          <Route path="/certificates/preview/:id" element={<PdfPreview />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
