import React, { useEffect } from 'react';
import { 
  Box, Grid, Typography, Paper, Alert, 
  FormControl, InputLabel, Select, MenuItem, 
  Checkbox, Button 
} from '@mui/material';
import { FileCopy as FileCopyIcon } from '@mui/icons-material';

/**
 * Componente para asignar PDFs a agujas
 * 
 * Permite asignar PDFs de ensayos de dureza y partículas a agujas seleccionadas
 */
const PDFAssignmentMatrix = ({ 
  needles = [], 
  hardnessTestPdfs = [], 
  particleTestPdfs = [], 
  needleInventory = [],
  setValue
}) => {
  // Verificar si hay agujas seleccionadas con serial_number
  const hasSelectedNeedles = needles.some(needle => needle.serial_number);
  
  // Asignación automática cuando sólo hay un PDF de cada tipo
  useEffect(() => {
    if (hardnessTestPdfs.length === 1) {
      const pdfId = hardnessTestPdfs[0].id;
      const updatedNeedles = needles.map(needle => {
        if (needle.serial_number && !needle.hardnessTestPdfId) {
          return { ...needle, hardnessTestPdfId: pdfId };
        }
        return needle;
      });
      
      // Si hay cambios, actualizar los needles
      if (JSON.stringify(updatedNeedles) !== JSON.stringify(needles)) {
        setValue('needles', updatedNeedles);
        setValue('selectedNeedles', updatedNeedles);
      }
    }
  }, [hardnessTestPdfs, needles, setValue]);
  
  // Asignación automática de PDFs de partículas
  useEffect(() => {
    if (particleTestPdfs.length === 1) {
      const pdfId = particleTestPdfs[0].id;
      const updatedNeedles = needles.map(needle => {
        if (needle.serial_number && !needle.particleTestPdfId) {
          return { ...needle, particleTestPdfId: pdfId };
        }
        return needle;
      });
      
      // Si hay cambios, actualizar los needles
      if (JSON.stringify(updatedNeedles) !== JSON.stringify(needles)) {
        setValue('needles', updatedNeedles);
        setValue('selectedNeedles', updatedNeedles);
      }
    }
  }, [particleTestPdfs, needles, setValue]);
  
  // UI para los PDFs de dureza
  const renderHardnessSection = () => {
    // Si solo hay un PDF de dureza, mostrar UI simplificada para este tipo
    if (hardnessTestPdfs.length === 1) {
      return (
        <Paper sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FileCopyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {hardnessTestPdfs[0].name}
            </Typography>
          </Box>
          <Alert severity="success" sx={{ mt: 1 }}>
            Este PDF se asignará automáticamente a todas las agujas seleccionadas.
          </Alert>
        </Paper>
      );
    }
    
    // Si hay múltiples PDFs de dureza, mostrar UI con selectores
    if (hardnessTestPdfs.length > 1) {
      return (
        <Box>
          {hardnessTestPdfs.map((pdf, index) => (
            <Paper key={pdf.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FileCopyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {pdf.name}
                </Typography>
              </Box>
              {renderNeedleSelector(pdf.id, 'hardness')}
              
              {/* Resumen de agujas asignadas */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {needles.filter(n => n.serial_number && n.hardnessTestPdfId === pdf.id).length} agujas asignadas
                </Typography>
              </Box>
            </Paper>
          ))}
          
          {/* Botón para asignar todas las agujas al primer PDF */}
          {hasSelectedNeedles && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => {
                const pdfId = hardnessTestPdfs[0].id;
                const updatedNeedles = needles.map(needle => ({
                  ...needle,
                  hardnessTestPdfId: needle.serial_number ? pdfId : ''
                }));
                setValue('needles', updatedNeedles);
                setValue('selectedNeedles', updatedNeedles);
              }}
              sx={{ mt: 1 }}
            >
              Asignar todas las agujas al primer PDF
            </Button>
          )}
        </Box>
      );
    }
    
    // Si no hay PDFs de dureza
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No hay PDFs de ensayo de dureza añadidos. Súbelos primero para asignarlos a las agujas.
      </Alert>
    );
  };
  
  // UI para los PDFs de partículas
  const renderParticleSection = () => {
    // Si solo hay un PDF de partículas, mostrar UI simplificada para este tipo
    if (particleTestPdfs.length === 1) {
      return (
        <Paper sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FileCopyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {particleTestPdfs[0].name}
            </Typography>
          </Box>
          <Alert severity="success" sx={{ mt: 1 }}>
            Este PDF se asignará automáticamente a todas las agujas seleccionadas.
          </Alert>
        </Paper>
      );
    }
    
    // Si hay múltiples PDFs de partículas, mostrar UI con selectores
    if (particleTestPdfs.length > 1) {
      return (
        <Box>
          {particleTestPdfs.map((pdf, index) => (
            <Paper key={pdf.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FileCopyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {pdf.name}
                </Typography>
              </Box>
              {renderNeedleSelector(pdf.id, 'particle')}
              
              {/* Resumen de agujas asignadas */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {needles.filter(n => n.serial_number && n.particleTestPdfId === pdf.id).length} agujas asignadas
                </Typography>
              </Box>
            </Paper>
          ))}
          
          {/* Botón para asignar todas las agujas al primer PDF */}
          {hasSelectedNeedles && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => {
                const pdfId = particleTestPdfs[0].id;
                const updatedNeedles = needles.map(needle => ({
                  ...needle,
                  particleTestPdfId: needle.serial_number ? pdfId : ''
                }));
                setValue('needles', updatedNeedles);
                setValue('selectedNeedles', updatedNeedles);
              }}
              sx={{ mt: 1 }}
            >
              Asignar todas las agujas al primer PDF
            </Button>
          )}
        </Box>
      );
    }
    
    // Si no hay PDFs de partículas
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No hay PDFs de ensayo de partículas añadidos. Súbelos primero para asignarlos a las agujas.
      </Alert>
    );
  };
  
  // Selector múltiple de agujas para un PDF
  const renderNeedleSelector = (pdfId, pdfType) => {
    // Obtenemos todas las agujas que tienen este PDF asignado
    const assignedNeedles = needles
      .map((needle, index) => ({ ...needle, index }))
      .filter(needle => needle.serial_number && 
        (pdfType === 'hardness' ? needle.hardnessTestPdfId === pdfId : needle.particleTestPdfId === pdfId));
    
    // Obtenemos todas las agujas seleccionadas para mostrar en el selector
    const needleOptions = needles
      .map((needle, index) => {
        if (!needle.serial_number) return null;
        
        const needleInfo = Array.isArray(needleInventory) 
          ? needleInventory.find(n => String(n.id) === String(needle.serial_number)) 
          : null;
        
        return {
          index,
          id: needle.serial_number,
          label: needleInfo ? `Aguja ${needleInfo.num}` : `Aguja #${index + 1}`,
          isAssigned: pdfType === 'hardness' 
            ? needle.hardnessTestPdfId === pdfId 
            : needle.particleTestPdfId === pdfId
        };
      })
      .filter(Boolean); // Filtrar valores nulos
    
    // No mostrar el selector si no hay agujas disponibles
    if (needleOptions.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No hay agujas seleccionadas para asociar.
        </Typography>
      );
    }
    
    // Controlador para cambios en la selección
    const handleSelectionChange = (event) => {
      const selectedIndices = event.target.value;
      
      // Actualizar las agujas seleccionadas
      const updatedNeedles = [...needles];
      
      // Primero, desasignar este PDF de todas las agujas
      needles.forEach((needle, index) => {
        if (needle.serial_number) {
          if (pdfType === 'hardness' && needle.hardnessTestPdfId === pdfId) {
            updatedNeedles[index] = { ...needle, hardnessTestPdfId: '' };
          } else if (pdfType === 'particle' && needle.particleTestPdfId === pdfId) {
            updatedNeedles[index] = { ...needle, particleTestPdfId: '' };
          }
        }
      });
      
      // Luego, asignar este PDF a las agujas seleccionadas
      selectedIndices.forEach(index => {
        if (pdfType === 'hardness') {
          updatedNeedles[index] = { ...updatedNeedles[index], hardnessTestPdfId: pdfId };
        } else {
          updatedNeedles[index] = { ...updatedNeedles[index], particleTestPdfId: pdfId };
        }
      });
      
      // Actualizar ambos arrays para mantener la sincronización
      setValue('needles', updatedNeedles);
      setValue('selectedNeedles', updatedNeedles);
    };
    
    return (
      <FormControl fullWidth size="small" sx={{ mt: 1 }}>
        <InputLabel id={`${pdfType}-${pdfId}-label`}>Agujas asociadas</InputLabel>
        <Select
          labelId={`${pdfType}-${pdfId}-label`}
          multiple
          value={assignedNeedles.map(needle => needle.index)}
          onChange={handleSelectionChange}
          renderValue={(selected) => {
            const selectedLabels = selected.map(index => {
              const needle = needleOptions.find(n => n.index === index);
              return needle ? needle.label : '';
            }).filter(Boolean);
            
            return selectedLabels.length > 0 
              ? selectedLabels.join(', ') 
              : 'Ninguna aguja asignada';
          }}
          sx={{ minWidth: '200px' }}
        >
          {needleOptions.map(needle => (
            <MenuItem key={needle.index} value={needle.index}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Checkbox checked={needle.isAssigned} />
                <Typography>{needle.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };
  
  // Si no hay agujas seleccionadas, mostrar mensaje informativo
  if (!hasSelectedNeedles) {
    return (
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #90caf9',
          '& .MuiAlert-icon': { 
            color: '#1976d2',
            fontSize: '1.5rem'
          }
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
          Para completar la asignación de PDFs:
        </Typography>
        <Typography variant="body2" component="div">
          1. Selecciona agujas en la sección <strong>"Selección de Agujas"</strong> arriba.
          <br/>
          2. Puedes seleccionar una aguja existente, o hacer clic en <strong>"Añadir Aguja"</strong> para agregar una nueva.
          <br/>
          3. Una vez seleccionada al menos una aguja, podrás asignarla a los PDFs subidos.
        </Typography>
      </Alert>
    );
  }
  
  // Renderizar la matriz de asignación
  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            PDFs de Ensayo Dureza
          </Typography>
          {renderHardnessSection()}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            PDFs de Ensayo Partículas
          </Typography>
          {renderParticleSection()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PDFAssignmentMatrix; 