import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { FileCopy as FileCopyIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

/**
 * Componente reutilizable para cargar archivos
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onFileSelected - Función a ejecutar cuando se selecciona un archivo
 * @param {Object} props.value - Archivo seleccionado actualmente
 * @param {Function} props.onClear - Función para eliminar el archivo seleccionado
 * @param {Array} props.acceptedFileTypes - Tipos de archivo aceptados (ej: ['pdf'])
 * @param {string} props.label - Etiqueta para mostrar
 * @param {string} props.buttonText - Texto del botón de carga
 */
const FileUploader = ({
  onFileSelected,
  value,
  onClear,
  acceptedFileTypes = ['pdf'],
  label = 'Subir archivo',
  buttonText = 'Subir archivo',
}) => {
  const handleFileUpload = async () => {
    try {
      // Construir filtros para los tipos de archivo aceptados
      const filters = acceptedFileTypes.length > 0
        ? [{ name: 'Archivos', extensions: acceptedFileTypes }]
        : undefined;

      const result = await window.api.openFileDialog({ filters });
      
      if (result.success && !result.canceled) {
        const newFile = {
          id: uuidv4(),
          name: result.fileName,
          path: result.filePath,
          fileData: result.fileBuffer,
          type: acceptedFileTypes[0] || 'unknown'
        };
        
        if (onFileSelected) {
          onFileSelected(newFile);
        }
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
    }
  };

  return (
    <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center' }}>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      
      {value ? (
        <Box display="flex" flexDirection="column" alignItems="center">
          <FileCopyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="body2" noWrap sx={{ maxWidth: '180px' }}>{value.name}</Typography>
          <Button 
            size="small" 
            color="error" 
            onClick={onClear}
          >
            Eliminar
          </Button>
        </Box>
      ) : (
        <Button
          variant="outlined"
          startIcon={<FileUploadIcon />}
          onClick={handleFileUpload}
        >
          {buttonText}
        </Button>
      )}
    </Box>
  );
};

export default FileUploader; 