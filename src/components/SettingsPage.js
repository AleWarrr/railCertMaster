import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
  Switch,
  FormGroup,
  FormControlLabel,
  TextField,
  Grid,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultSavePath: '',
    autosave: true,
    pdfQuality: 'high',
    autoNumbering: true,
    showCompanyLogo: true,
    dateFormat: 'DD/MM/YYYY'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Simulate loading settings
    const loadSettings = async () => {
      try {
        // In a real app, you would load settings from electron-store
        // For now, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set default settings for now
        setSettings({
          defaultSavePath: '',
          autosave: true,
          pdfQuality: 'high',
          autoNumbering: true,
          showCompanyLogo: true,
          dateFormat: 'DD/MM/YYYY'
        });
      } catch (error) {
        console.error('Error loading settings:', error);
        setSnackbar({
          open: true,
          message: `Error loading settings: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChangeSetting = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // In a real app, you would save settings to electron-store
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: `Error saving settings: ${error.message}`,
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
        Settings
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Default Save Path"
                fullWidth
                variant="outlined"
                value={settings.defaultSavePath}
                onChange={(e) => handleChangeSetting('defaultSavePath', e.target.value)}
                placeholder="Choose a default location to save certificates"
                helperText="Leave empty to choose location each time"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autosave}
                      onChange={(e) => handleChangeSetting('autosave', e.target.checked)}
                    />
                  }
                  label="Enable auto-save"
                />
              </FormGroup>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoNumbering}
                    onChange={(e) => handleChangeSetting('autoNumbering', e.target.checked)}
                  />
                }
                label="Automatic certificate numbering"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            PDF Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="PDF Quality"
                fullWidth
                variant="outlined"
                value={settings.pdfQuality}
                onChange={(e) => handleChangeSetting('pdfQuality', e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Date Format"
                fullWidth
                variant="outlined"
                value={settings.dateFormat}
                onChange={(e) => handleChangeSetting('dateFormat', e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showCompanyLogo}
                    onChange={(e) => handleChangeSetting('showCompanyLogo', e.target.checked)}
                  />
                }
                label="Show company logo on certificates"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
      
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
