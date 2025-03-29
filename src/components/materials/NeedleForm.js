import React from 'react';
import { 
  Box, Grid, Typography, Divider, Alert, 
} from '@mui/material';
import { registerMaterial } from '../../utils/materialRegistry';
import { createMaterialForm } from './MaterialFormInterface';
import NeedlesForm from '../NeedlesForm';
import PDFAssignmentMatrix from '../certificates/PDFAssignmentMatrix';

/**
 * Implementación del formulario para el material "aguja"
 */
const NeedleFormImplementation = createMaterialForm({
  /**
   * Renderiza el formulario específico para agujas
   */
  renderForm: (props) => {
    const { 
      control, 
      errors, 
      watch, 
      setValue, 
      handleNext,
      needleInventory
    } = props;
    
    // Obtener las agujas seleccionadas actualmente
    const needles = watch('needles') || [];
    // Verificar si hay al menos una aguja con serial_number (seleccionada)
    const hasSelectedNeedles = needles.some(needle => needle.serial_number);
    
    // Controlador para la selección de agujas
    const handleNeedleSelection = (fieldIndex, needleId) => {
      console.log(`Aguja seleccionada en campo ${fieldIndex}: ${needleId}`);
      
      // Obtener arrays actuales
      const currentNeedles = watch('needles') || [];
      const selectedNeedles = watch('selectedNeedles') || [];
      
      // Actualizar el array de needles
      const updatedNeedles = [...currentNeedles];
      if (updatedNeedles[fieldIndex]) {
        updatedNeedles[fieldIndex] = {
          ...updatedNeedles[fieldIndex],
          serial_number: needleId, // Si needleId es vacío, esto deseleccionará la aguja
          hardnessTestPdfId: updatedNeedles[fieldIndex].hardnessTestPdfId || '',
          particleTestPdfId: updatedNeedles[fieldIndex].particleTestPdfId || ''
        };
      }
      
      // Actualizar ambos arrays para mantener sincronización
      setValue('needles', updatedNeedles);
      setValue('selectedNeedles', updatedNeedles);
      
      // Forzar un re-renderizado para actualizar la UI inmediatamente
      setTimeout(() => {
        const freshNeedles = [...updatedNeedles];
        setValue('needles', freshNeedles);
      }, 10);
    };
    
    return (
      <div>
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Selección de agujas *
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Seleccione al menos una aguja para continuar
          </Typography>
        </Box>
        <Grid item xs={12}>
          <NeedlesForm 
            control={control} 
            errors={errors} 
            watch={watch} 
            setValue={setValue} 
            onNext={handleNext}
            hideComments={true}
            onNeedleSelect={handleNeedleSelection}
            needleInventory={needleInventory}
          />
          
          {/* 
            NOTA: Esta sección está temporalmente deshabilitada.
            La matriz de asignación de PDFs a agujas será responsabilidad del inspector, no del fabricante.
            Este código se conserva para implementarlo en la UI del inspector posteriormente.
          
          {hasSelectedNeedles && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Asignación de PDFs a Agujas
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <PDFAssignmentMatrix 
                needles={needles}
                hardnessTestPdfs={watch('hardnessTestPdfs') || []}
                particleTestPdfs={watch('particleTestPdfs') || []}
                needleInventory={needleInventory}
                setValue={setValue}
              />
            </>
          )}
          */}
        </Grid>
      </div>
    );
  },
  
  /**
   * Valida los datos específicos para agujas
   */
  validate: (data) => {
    const errors = {};
    
    // Verificar que al menos una aguja esté seleccionada
    if (!data.needles || !data.needles.some(n => n.serial_number)) {
      errors.needles = 'Debe seleccionar al menos una aguja';
    }
    
    // La validación de asignación de PDFs a agujas se ha eliminado ya que ahora
    // esto será responsabilidad del inspector, no del fabricante.
    // El siguiente comentario se mantiene para referencia futura:
    /*
    // Verificar que cada aguja tenga al menos un PDF asignado
    if (data.needles && data.needles.some(n => 
      n.serial_number && !n.hardnessTestPdfId && !n.particleTestPdfId)) {
      errors.needlesAssignment = 'Todas las agujas deben tener al menos un PDF asignado';
    }
    */
    
    return errors;
  },
  
  /**
   * Obtiene los valores por defecto para agujas
   */
  getDefaultValues: () => {
    return {
      selectedNeedles: [{ needleId: '' }],
      needles: [{ needleId: '' }],
      hardnessTestPdfs: [],
      particleTestPdfs: []
    };
  },
  
  /**
   * Lista de archivos adjuntos requeridos para agujas
   */
  getRequiredAttachments: () => {
    return ['templatePdf', 'hardnessTestPdf', 'particleTestPdf'];
  },
  
  /**
   * Genera un número de certificado para agujas
   */
  generateCertificateNumber: () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AG-${year}${month}-${random}`;
  },
  
  /**
   * Procesa los datos antes de guardar
   */
  processDataBeforeSave: (data) => {
    // Preparar datos para enviar al servidor
    return {
      ...data,
      // Construir el objeto con los múltiples PDFs y sus asociaciones
      attachments: {
        ...(data.attachments || {}),
        templatePdf: data.attachments?.templatePdf || null,
        hardnessTestPdfs: data.hardnessTestPdfs || [],
        particleTestPdfs: data.particleTestPdfs || []
      },
      // Las agujas seleccionadas se guardan sin asignaciones específicas de PDFs
      // Esto será completado por el inspector posteriormente
      selectedNeedles: (data.needles || [])
        .filter(needle => needle.serial_number)
        .map(needle => ({
          needleId: needle.serial_number
        }))
    };
  }
});

// Registrar la implementación para el tipo 'aguja'
registerMaterial('aguja', NeedleFormImplementation);

export default NeedleFormImplementation; 