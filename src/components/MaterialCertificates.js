import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { MATERIAL_TYPES } from '../utils/materialTemplates';

const MaterialCertificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        setLoading(true);
        const result = await window.api.getCertificates();
        
        if (result.success) {
          // Convert object to array and sort by date
          const certificatesArray = Object.values(result.data || {})
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setCertificates(certificatesArray);
        } else {
          throw new Error(result.error || 'Failed to load certificates');
        }
      } catch (error) {
        console.error('Error loading certificates:', error);
        setSnackbar({
          open: true,
          message: `Error loading certificates: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      // In a real app, you would delete the certificate here
      // For now, we'll just filter it out from the state
      setCertificates(certificates.filter(cert => cert.id !== deleteConfirm.id));
      
      setSnackbar({
        open: true,
        message: 'Certificate deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting certificate:', error);
      setSnackbar({
        open: true,
        message: `Error deleting certificate: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDuplicateCertificate = (certificate) => {
    // Clone the certificate with a new ID and navigate to edit
    const newCertificate = {
      ...certificate,
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      certificateNumber: `${certificate.certificateNumber}-COPY`
    };
    
    // In a real app, you would save the new certificate to your store here
    // For now, we'll just navigate to the edit page
    navigate(`/certificates/edit/${newCertificate.id}`);
  };

  // Filter certificates based on search query and type filter
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.certificateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.materialType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || cert.materialType === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Material Certificates
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/certificates/new')}
        >
          Create New Certificate
        </Button>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <TextField
              label="Search Certificates"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
              sx={{ flexGrow: 1, minWidth: '200px' }}
            />
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: '200px' }}>
              <InputLabel id="filter-type-label">Material Type</InputLabel>
              <Select
                labelId="filter-type-label"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Material Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                {MATERIAL_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>
      
      {filteredCertificates.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell><strong>Certificate #</strong></TableCell>
                <TableCell><strong>Material Type</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Date Created</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCertificates.map((certificate) => (
                <TableRow key={certificate.id} hover>
                  <TableCell>{certificate.certificateNumber || 'N/A'}</TableCell>
                  <TableCell>{certificate.materialType || 'Unknown'}</TableCell>
                  <TableCell>{certificate.customerName || 'N/A'}</TableCell>
                  <TableCell>
                    {certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: certificate.status === 'draft' ? '#fff9c4' : '#c8e6c9',
                        color: certificate.status === 'draft' ? '#f57f17' : '#2e7d32',
                      }}
                    >
                      {certificate.status || 'Draft'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Certificate">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/certificates/preview/${certificate.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Certificate">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/certificates/edit/${certificate.id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate Certificate">
                      <IconButton
                        color="secondary"
                        onClick={() => handleDuplicateCertificate(certificate)}
                      >
                        <FileCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Certificate">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(certificate.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
            <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No certificates found
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              {certificates.length === 0 
                ? "You haven't created any certificates yet."
                : "No certificates match your search criteria."}
            </Typography>
            {certificates.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/certificates/new')}
              >
                Create First Certificate
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
      >
        <DialogTitle>Delete Certificate</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this certificate? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
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

export default MaterialCertificates;
