import React from 'react';
import { Box, Grid, Typography, Button, IconButton, Alert } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, FileCopy as FileCopyIcon } from '@mui/icons-material';
import FileUploader from '../common/FileUploader';
import { getMaterialForm, hasMaterialForm } from '../../utils/materialRegistry';

/**
 * Componente para gestionar los archivos adjuntos según el tipo de material
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.materialType - Tipo de material
 * @param {Function} props.control - Control de react-hook-form
 * @param {Function} props.watch - Función watch de react-hook-form
 * @param {Function} props.setValue - Función setValue de react-hook-form
 * @param {Function} props.append* - Funciones append de useFieldArray para cada tipo de archivo
 * @param {Function} props.remove* - Funciones remove de useFieldArray para cada tipo de archivo
 */
const AttachmentsManager = ({
  materialType,
  control,
  watch,
  setValue,
  
  // Field arrays para archivos
  appendHardnessTestPdf,
  removeHardnessTestPdf,
  hardnessTestPdfsFields,
  
  appendParticleTestPdf,
  removeParticleTestPdf,
  particleTestPdfsFields,
  
  // Otros
  onSnackbarMessage
}) => {
  // Si hay un material registrado, obtener su implementación
  const materialImplementation = hasMaterialForm(materialType) 
    ? getMaterialForm(materialType) 
    : null;
  
  // Función para añadir un PDF de dureza
  const handleAddHardnessTestPdf = async () => {
    try {
      const result = await window.api.openFileDialog({ 
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (result.success && !result.canceled) {
        const newPdf = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          name: result.fileName,
          path: result.filePath,
          fileData: result.fileBuffer,
          type: 'hardnessTestPdf'
        };
        appendHardnessTestPdf(newPdf);
        
        // Ya no actualizamos las agujas aquí pues la asignación será
        // responsabilidad del inspector posteriormente
        
        // Mostrar mensaje de éxito
        if (onSnackbarMessage) {
          onSnackbarMessage({
            open: true,
            message: 'PDF de ensayo de dureza añadido correctamente',
            severity: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Error al subir PDF:', error);
      if (onSnackbarMessage) {
        onSnackbarMessage({
          open: true,
          message: `Error al subir PDF: ${error.message}`,
          severity: 'error'
        });
      }
    }
  };

  // Función para añadir un PDF de partículas
  const handleAddParticleTestPdf = async () => {
    try {
      const result = await window.api.openFileDialog({ 
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (result.success && !result.canceled) {
        const newPdf = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          name: result.fileName,
          path: result.filePath,
          fileData: result.fileBuffer,
          type: 'particleTestPdf'
        };
        appendParticleTestPdf(newPdf);
        
        // Ya no actualizamos las agujas aquí pues la asignación será
        // responsabilidad del inspector posteriormente
        
        // Mostrar mensaje de éxito
        if (onSnackbarMessage) {
          onSnackbarMessage({
            open: true,
            message: 'PDF de ensayo de partículas añadido correctamente',
            severity: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Error al subir PDF:', error);
      if (onSnackbarMessage) {
        onSnackbarMessage({
          open: true,
          message: `Error al subir PDF: ${error.message}`,
          severity: 'error'
        });
      }
    }
  };
  
  // Función para manejar la eliminación de un PDF de dureza
  const handleRemoveHardnessTestPdf = (index) => {
    // Obtener el ID del PDF que vamos a eliminar
    const pdfToRemove = hardnessTestPdfsFields[index];
    
    // Eliminar el PDF del array
    removeHardnessTestPdf(index);
    
    // Ya no actualizamos las asignaciones de agujas aquí pues la asignación
    // será responsabilidad del inspector posteriormente
    
    // Mostrar mensaje de éxito
    if (onSnackbarMessage) {
      onSnackbarMessage({
        open: true,
        message: 'PDF de ensayo de dureza eliminado correctamente',
        severity: 'success'
      });
    }
  };

  // Función para manejar la eliminación de un PDF de partículas
  const handleRemoveParticleTestPdf = (index) => {
    // Obtener el ID del PDF que vamos a eliminar
    const pdfToRemove = particleTestPdfsFields[index];
    
    // Eliminar el PDF del array
    removeParticleTestPdf(index);
    
    // Ya no actualizamos las asignaciones de agujas aquí pues la asignación
    // será responsabilidad del inspector posteriormente
    
    // Mostrar mensaje de éxito
    if (onSnackbarMessage) {
      onSnackbarMessage({
        open: true,
        message: 'PDF de ensayo de partículas eliminado correctamente',
        severity: 'success'
      });
    }
  };

  // Renderizar los campos específicos para el material "aguja"
  const renderNeedleAttachments = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FileUploader
            label="PDF Planilla *"
            value={watch('attachments.templatePdf')}
            onFileSelected={(file) => setValue('attachments.templatePdf', file)}
            onClear={() => setValue('attachments.templatePdf', null)}
            acceptedFileTypes={['pdf']}
            buttonText="Subir PDF"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">PDFs Ensayo Dureza *</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddHardnessTestPdf}
              >
                Añadir PDF
              </Button>
            </Box>
            
            {hardnessTestPdfsFields.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" my={2}>
                No hay PDFs de ensayos de dureza añadidos
              </Typography>
            ) : (
              <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                {hardnessTestPdfsFields.map((pdf, index) => (
                  <Box 
                    key={pdf.id} 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="space-between"
                    sx={{ 
                      p: 1, 
                      mb: 1, 
                      border: '1px solid #eee', 
                      borderRadius: 1,
                      backgroundColor: 'background.paper' 
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <FileCopyIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                        {pdf.name}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleRemoveHardnessTestPdf(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">PDFs Ensayo Partículas *</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddParticleTestPdf}
              >
                Añadir PDF
              </Button>
            </Box>
            
            {particleTestPdfsFields.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" my={2}>
                No hay PDFs de ensayos de partículas añadidos
              </Typography>
            ) : (
              <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                {particleTestPdfsFields.map((pdf, index) => (
                  <Box 
                    key={pdf.id} 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="space-between"
                    sx={{ 
                      p: 1, 
                      mb: 1, 
                      border: '1px solid #eee', 
                      borderRadius: 1,
                      backgroundColor: 'background.paper' 
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <FileCopyIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                        {pdf.name}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleRemoveParticleTestPdf(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    );
  };

  // Renderizar los archivos adjuntos según el tipo de material
  const renderAttachmentsByMaterialType = () => {
    switch (materialType) {
      case 'aguja':
        return renderNeedleAttachments();
      case 'rail':
        return (
          <Alert severity="info" sx={{ mb: 2 }}>
            Se configurarán los documentos específicos para rieles.
          </Alert>
        );
      case 'sleeper':
        return (
          <Alert severity="info" sx={{ mb: 2 }}>
            Se configurarán los documentos específicos para traviesas.
          </Alert>
        );
      default:
        return (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No se ha definido un gestor de archivos para el tipo de material: {materialType}
          </Alert>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Documentos Requeridos para {materialType.charAt(0).toUpperCase() + materialType.slice(1)}
      </Typography>
      {renderAttachmentsByMaterialType()}
    </Box>
  );
};

export default AttachmentsManager; 