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
          message: 'Failed to load company profile data.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadCompanyProfile();
  }, [setValue]);

  const handleLogoUpload = (event) => {
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
    try {
      setSaving(true);
      const result = await window.api.saveCompanyProfile(data);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Company profile saved successfully!',
          severity: 'success'
        });
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving company profile:', error);
      setSnackbar({
        open: true,
        message: `Error saving profile: ${error.message}`,
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
        Company Profile
      </Typography>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Company Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="companyName"
                      control={control}
                      rules={{ required: 'Company name is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Company Name"
                          variant="outlined"
                          error={!!errors.companyName}
                          helperText={errors.companyName?.message}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="contactName"
                      control={control}
                      rules={{ required: 'Contact name is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Contact Name"
                          variant="outlined"
                          error={!!errors.contactName}
                          helperText={errors.contactName?.message}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="email"
                      control={control}
                      rules={{ 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
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
                          label="Phone"
                          variant="outlined"
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
                          label="Website"
                          variant="outlined"
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
                          label="Address"
                          variant="outlined"
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
                          label="City"
                          variant="outlined"
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
                          label="State/Province"
                          variant="outlined"
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
                          label="Zip/Postal Code"
                          variant="outlined"
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
                          label="Country"
                          variant="outlined"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Additional Information
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
                          label="Company Registration Number"
                          variant="outlined"
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
                          label="Tax ID / VAT Number"
                          variant="outlined"
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
                  Company Logo
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    flexDirection: 'column',
                    mb: 2
                  }}
                >
                  {logoPreview ? (
                    <Box 
                      component="img"
                      src={logoPreview}
                      alt="Company Logo"
                      sx={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        objectFit: 'contain',
                        mb: 2
                      }}
                    />
                  ) : (
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        width: '100%', 
                        height: '200px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        border: '1px dashed #ccc',
                        mb: 2
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No logo uploaded
                      </Typography>
                    </Paper>
                  )}
                  
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Recommended format: PNG or SVG with transparent background
                  </Typography>
                </Box>
                
                <Controller
                  name="logoBase64"
                  control={control}
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />
              </CardContent>
            </Card>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </Grid>
        </Grid>
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
