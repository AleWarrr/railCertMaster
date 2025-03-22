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
  Edit as EditIcon
} from '@mui/icons-material';
import { getCertificates, getCompanyProfile } from '../utils/dataStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get company profile
        const profileResult = await window.api.getCompanyProfile();
        if (profileResult.success) {
          setCompanyProfile(profileResult.data);
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
        setError('Failed to load dashboard data. Please try again.');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
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
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Company Profile Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon color="primary" fontSize="large" sx={{ mr: 2 }} />
                <Typography variant="h5" component="div">
                  Company Profile
                </Typography>
              </Box>
              
              {companyProfile && Object.keys(companyProfile).length > 0 ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    <strong>Company Name:</strong> {companyProfile.companyName || 'Not set'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Contact:</strong> {companyProfile.contactName || 'Not set'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Email:</strong> {companyProfile.email || 'Not set'}
                  </Typography>
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No company profile has been set up. Please create a profile to continue.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                startIcon={companyProfile ? <EditIcon /> : <AddIcon />}
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/company-profile')}
              >
                {companyProfile ? 'Edit' : 'Create'} Profile
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Recent Certificates Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DescriptionIcon color="primary" fontSize="large" sx={{ mr: 2 }} />
                <Typography variant="h5" component="div">
                  Recent Certificates
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
                        onClick={() => navigate(`/certificates/edit/${certificate.id}`)}
                      >
                        View
                      </Button>
                    </Box>
                    {index < certificates.slice(0, 3).length - 1 && <Divider />}
                  </Box>
                ))
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No certificates have been created yet.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                startIcon={<AddIcon />}
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/certificates/new')}
              >
                Create Certificate
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/certificates')}
              >
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Quick Actions Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/certificates/new')}
              >
                New Certificate
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/certificates')}
              >
                Manage Certificates
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/company-profile')}
              >
                Edit Company Profile
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
