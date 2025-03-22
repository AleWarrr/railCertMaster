import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';
import { generateCertificatePdf } from '../utils/pdfGenerator';

const PdfPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const iframeRef = useRef(null);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        setLoading(true);
        
        // Get certificate data
        const result = await window.api.getCertificates();
        if (result.success && result.data && result.data[id]) {
          setCertificateData(result.data[id]);
          await generatePdfPreview(result.data[id]);
        } else {
          throw new Error('Certificate not found');
        }
      } catch (error) {
        console.error('Error loading certificate:', error);
        setError(error.message);
        setSnackbar({
          open: true,
          message: `Error loading certificate: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();

    // Cleanup function
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [id]);

  const generatePdfPreview = async (data) => {
    try {
      setGenerating(true);
      
      // Generate PDF
      const pdfData = await generateCertificatePdf(data);
      
      // Convert base64 to Blob
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create URL for the Blob
      const url = URL.createObjectURL(blob);
      
      setPdfBlob(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF preview');
      setSnackbar({
        open: true,
        message: `Error generating PDF: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePdf = async () => {
    try {
      if (!pdfBlob) throw new Error('No PDF generated');
      
      // Convert Blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        
        // Use Electron to save the file
        const result = await window.api.saveFileDialog({
          defaultPath: `Certificate_${certificateData.certificateNumber}.pdf`,
          pdfData: base64data
        });
        
        if (result.success) {
          setSnackbar({
            open: true,
            message: `PDF saved to ${result.filePath}`,
            severity: 'success'
          });
        } else if (!result.canceled) {
          throw new Error(result.error || 'Failed to save PDF');
        }
      };
    } catch (error) {
      console.error('Error saving PDF:', error);
      setSnackbar({
        open: true,
        message: `Error saving PDF: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading || generating) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" flexDirection="column">
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1">
          {loading ? 'Loading certificate data...' : 'Generating PDF preview...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate('/certificates')}
        >
          Back to Certificates
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Certificate Preview
        </Typography>
        
        <Box>
          <Tooltip title="Back to Certificates">
            <IconButton
              color="inherit"
              onClick={() => navigate('/certificates')}
              sx={{ mr: 1 }}
            >
              <BackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Certificate">
            <IconButton
              color="primary"
              onClick={() => navigate(`/certificates/edit/${id}`)}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Certificate">
            <IconButton
              color="primary"
              onClick={handlePrint}
              sx={{ mr: 1 }}
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleSavePdf}
          >
            Save PDF
          </Button>
        </Box>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%', 
          height: 'calc(100vh - 180px)', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Certificate PDF Preview"
          />
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <Typography variant="body1" color="text.secondary">
              PDF preview not available
            </Typography>
          </Box>
        )}
      </Paper>
      
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

export default PdfPreview;
