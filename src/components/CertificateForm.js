import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Paper,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';

// Importamos los nuevos componentes y hooks
import TabPanel from './common/TabPanel';
import AttachmentsManager from './certificates/AttachmentsManager';
import useCertificateForm from '../hooks/useCertificateForm';
import { getRegisteredMaterialTypes, getMaterialForm, hasMaterialForm } from '../utils/materialRegistry';
import { MATERIAL_TYPES_FULL, getMaterialLabel } from '../utils/materialTemplates';

/**
 * Componente principal para la creación y edición de certificados
 * Ahora utiliza el hook personalizado useCertificateForm para manejar la lógica
 */
const CertificateForm = ({ initialMaterialType }) => {
  // Utilizamos el hook personalizado que maneja toda la lógica
  const {
    form,
    fieldArrays,
    ui,
    handlers
  } = useCertificateForm({ initialMaterialType });

  // Extraemos lo necesario del form
  const { control, handleSubmit, watch, errors, isDirty } = form;
  
  // Extraemos los field arrays
  const {
    hardnessTestPdfs: hardnessTestPdfsArray,
    particleTestPdfs: particleTestPdfsArray
  } = fieldArrays;
  
  // Extraemos lo necesario de la UI
  const {
    activeTab,
    setActiveTab,
    activeStep,
    loading,
    saving,
    materialType,
    discardDialog,
    previewDialog,
    pdfDialog,
    snackbar,
    customers,
    inspectors,
    needleTypes,
    needleInventory,
    materialTypes,
    isEditMode
  } = ui;
  
  // Extraemos los handlers
  const {
    handleNext,
    handleBack,
    handleCancel,
    handleCloseSnackbar,
    handleCloseDiscardDialog,
    handleClosePreviewDialog,
    handleClosePdfDialog,
    saveCertificate,
    finalizeCertificate,
    generateCertificatePdf,
    handleNavigateToPreview
  } = handlers;
  
  // Función para cambiar de pestaña
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Pasos del stepper
  const steps = [
    'Información General',
    'Datos Técnicos',
    'Documentos',
    'Revisión'
  ];

  // Renderizar los campos específicos según el tipo de material
  const renderMaterialSpecificFields = () => {
    if (!materialType) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Por favor, seleccione un tipo de material para continuar.
        </Alert>
      );
    }

    // Verificar si hay una implementación registrada para este tipo de material
    if (!hasMaterialForm(materialType)) {
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No hay implementación disponible para el tipo de material: {materialType}
        </Alert>
      );
    }

    // Obtener la implementación del material y renderizar su formulario
    const materialForm = getMaterialForm(materialType);
    return materialForm.renderForm({
      control,
      errors,
      watch,
      setValue: form.setValue,
      handleNext,
      needleInventory,
      needleTypes
    });
  };

  // Render principal
  return (
    <Box sx={{ maxWidth: '100%', mb: 4 }}>
      {/* Título y botones principales */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          {isEditMode ? 'Editar Certificado' : 'Nuevo Certificado'}
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleCancel} 
            sx={{ mr: 1 }}
            disabled={saving}
          >
            Cancelar
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit(saveCertificate)}
            disabled={saving}
            sx={{ mr: 1 }}
          >
            Guardar
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PreviewIcon />}
            onClick={() => handleSubmit(handleNavigateToPreview)()}
            disabled={saving}
          >
            Vista Previa
          </Button>
        </Box>
      </Box>

      {/* Card principal */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Paso 1: Información General */}
              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Número de Certificado"
                      fullWidth
                      name="certificateNumber"
                      variant="outlined"
                      margin="normal"
                      disabled={materialType === 'aguja' || isEditMode}
                      value={watch('certificateNumber') || ''}
                      onChange={(e) => form.setValue('certificateNumber', e.target.value)}
                      error={!!errors.certificateNumber}
                      helperText={errors.certificateNumber?.message}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Número de Lote"
                      fullWidth
                      name="batchNumber"
                      variant="outlined"
                      margin="normal"
                      value={watch('batchNumber') || ''}
                      onChange={(e) => form.setValue('batchNumber', e.target.value)}
                      error={!!errors.batchNumber}
                      helperText={errors.batchNumber?.message}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Fecha"
                      type="date"
                      fullWidth
                      name="date"
                      variant="outlined"
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                      value={watch('date') || ''}
                      onChange={(e) => form.setValue('date', e.target.value)}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" margin="normal" error={!!errors.materialType}>
                      <InputLabel id="material-type-label">Tipo de Material</InputLabel>
                      <Select
                        labelId="material-type-label"
                        label="Tipo de Material"
                        disabled={!!initialMaterialType || isEditMode}
                        value={watch('materialType') || ''}
                        onChange={(e) => form.setValue('materialType', e.target.value)}
                      >
                        {MATERIAL_TYPES_FULL.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.materialType && (
                        <FormHelperText>{errors.materialType.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Información del Cliente
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" margin="normal" error={!!errors.customerId}>
                      <InputLabel id="cliente-label">Cliente</InputLabel>
                      <Select
                        labelId="cliente-label"
                        label="Cliente"
                        value={watch('customerId') || ''}
                        onChange={(e) => {
                          form.setValue('customerId', e.target.value);
                          // Buscar el cliente para mostrar su información
                          const cliente = customers.find(c => c.id === parseInt(e.target.value));
                          if (cliente) {
                            form.setValue('customerName', cliente.nombre || '');
                            form.setValue('customerNumber', cliente.customer_number || '');
                          }
                        }}
                      >
                        <MenuItem value="">Seleccione un cliente</MenuItem>
                        {customers.map((customer) => (
                          <MenuItem key={customer.id} value={customer.id}>
                            {customer.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.customerId && (
                        <FormHelperText>{errors.customerId.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  {/* Información del cliente seleccionado */}
                  {watch('customerId') && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mt: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Información del Cliente:
                        </Typography>
                        {customers.filter(c => c.id === parseInt(watch('customerId'))).map(customer => (
                          <Box key={customer.id} sx={{ ml: 2, mt: 1 }}>
                            <Typography variant="body2">
                              <strong>NIF:</strong> {customer.nif || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Localización:</strong> {customer.ubicacion || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Email:</strong> {customer.email || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Teléfono:</strong> {customer.telefono || 'No disponible'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Información del Inspector
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" margin="normal" error={!!errors.inspectorId}>
                      <InputLabel id="inspector-label">Inspector</InputLabel>
                      <Select
                        labelId="inspector-label"
                        label="Inspector"
                        value={watch('inspectorId') || ''}
                        onChange={(e) => {
                          form.setValue('inspectorId', e.target.value);
                          // Buscar el inspector para mostrar su información
                          const inspector = inspectors.find(i => i.id === parseInt(e.target.value));
                          if (inspector) {
                            form.setValue('inspectorCode', inspector.codigo_inspector || '');
                            form.setValue('inspectorEmail', inspector.email || '');
                          }
                        }}
                      >
                        <MenuItem value="">Seleccione un inspector</MenuItem>
                        {inspectors.map((inspector) => (
                          <MenuItem key={inspector.id} value={inspector.id}>
                            {inspector.nombre} ({inspector.codigo_inspector})
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.inspectorId && (
                        <FormHelperText>{errors.inspectorId.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  {/* Información del inspector seleccionado */}
                  {watch('inspectorId') && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mt: 1 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Información del Inspector:
                        </Typography>
                        {inspectors.filter(i => i.id === parseInt(watch('inspectorId'))).map(inspector => (
                          <Box key={inspector.id} sx={{ ml: 2, mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Código:</strong> {inspector.codigo_inspector || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Email:</strong> {inspector.email || 'No disponible'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        endIcon={<NextIcon />}
                        onClick={handleNext}
                      >
                        Siguiente
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Paso 2: Datos Técnicos */}
              {activeStep === 1 && (
                <>
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Datos Técnicos para {getMaterialLabel(materialType)}
                    </Typography>
                    
                    {/* Renderizar campos específicos del material */}
                    {renderMaterialSpecificFields()}
                  </Paper>
                
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PrevIcon />}
                      onClick={handleBack}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<NextIcon />}
                      onClick={handleNext}
                    >
                      Siguiente
                    </Button>
                  </Box>
                </>
              )}

              {/* Paso 3: Documentos */}
              {activeStep === 2 && (
                <>
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <AttachmentsManager
                      materialType={materialType}
                      control={control}
                      watch={watch}
                      setValue={form.setValue}
                      
                      // Field arrays para PDFs
                      appendHardnessTestPdf={hardnessTestPdfsArray.append}
                      removeHardnessTestPdf={hardnessTestPdfsArray.remove}
                      hardnessTestPdfsFields={hardnessTestPdfsArray.fields}
                      
                      appendParticleTestPdf={particleTestPdfsArray.append}
                      removeParticleTestPdf={particleTestPdfsArray.remove}
                      particleTestPdfsFields={particleTestPdfsArray.fields}
                      
                      // Pasar la función setSnackbar como onSnackbarMessage
                      onSnackbarMessage={ui.setSnackbar}
                    />
                    
                    <Box mt={3}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Comentarios Adicionales
                      </Typography>
                      <TextField
                        label="Comentarios"
                        fullWidth
                        multiline
                        rows={4}
                        name="comments"
                        variant="outlined"
                        margin="normal"
                        {...form.control.register('comments')}
                      />
                    </Box>
                  </Paper>
                  
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PrevIcon />}
                      onClick={handleBack}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<NextIcon />}
                      onClick={handleNext}
                    >
                      Siguiente
                    </Button>
                  </Box>
                </>
              )}

              {/* Paso 4: Revisión */}
              {activeStep === 3 && (
                <>
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Revisión del Certificado
                    </Typography>
                    
                    <Box mb={2}>
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Número de Certificado:</Typography>
                            <Typography variant="body2">{watch('certificateNumber') || 'N/A'}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Tipo de Material:</Typography>
                            <Typography variant="body2">
                              {materialType.charAt(0).toUpperCase() + materialType.slice(1) || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Cliente:</Typography>
                            <Typography variant="body2">{watch('customerName') || 'N/A'}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Referencia del Cliente:</Typography>
                            <Typography variant="body2">{watch('customerReference') || 'N/A'}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Número de Lote:</Typography>
                            <Typography variant="body2">{watch('batchNumber') || 'N/A'}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Fecha:</Typography>
                            <Typography variant="body2">{watch('date') || 'N/A'}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                      
                      <Typography variant="subtitle1" gutterBottom>
                        Documentos Adjuntos:
                      </Typography>
                      <Box mt={1}>
                        {materialType === 'aguja' && (
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2">Planilla:</Typography>
                              <Typography variant="body2">
                                {watch('attachments.templatePdf')?.name || 'No hay planilla adjunta'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2">PDFs de Ensayo de Dureza:</Typography>
                              <Typography variant="body2">
                                {watch('hardnessTestPdfs')?.length 
                                  ? `${watch('hardnessTestPdfs').length} archivos` 
                                  : 'No hay PDFs adjuntos'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2">PDFs de Ensayo de Partículas:</Typography>
                              <Typography variant="body2">
                                {watch('particleTestPdfs')?.length 
                                  ? `${watch('particleTestPdfs').length} archivos` 
                                  : 'No hay PDFs adjuntos'}
                              </Typography>
                            </Grid>
                          </Grid>
                        )}
                      </Box>
                      
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Comentarios:
                      </Typography>
                      <Typography variant="body2">
                        {watch('comments') || 'No hay comentarios adicionales'}
                      </Typography>
                    </Box>
                  </Paper>
                  
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PrevIcon />}
                      onClick={handleBack}
                    >
                      Anterior
                    </Button>
                    
                    <Box>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit(saveCertificate)}
                        disabled={saving}
                        sx={{ mr: 1 }}
                      >
                        Guardar Borrador
                      </Button>
                      
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleSubmit(finalizeCertificate)}
                        disabled={saving}
                      >
                        Finalizar y Generar PDF
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Diálogos y snackbars */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Diálogo de confirmación para descartar cambios */}
      <Dialog
        open={discardDialog}
        onClose={() => handleCloseDiscardDialog(false)}
      >
        <DialogTitle>Confirmar Cancelación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hay cambios sin guardar. ¿Está seguro de que desea salir sin guardar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDiscardDialog(false)} color="primary">
            No, Continuar Editando
          </Button>
          <Button onClick={() => handleCloseDiscardDialog(true)} color="error" autoFocus>
            Sí, Descartar Cambios
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de vista previa */}
      <Dialog
        open={previewDialog}
        onClose={() => handleClosePreviewDialog(false)}
      >
        <DialogTitle>Vista Previa de Certificado</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Para ver la vista previa del certificado, es necesario guardar los cambios actuales.
            ¿Desea continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClosePreviewDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={() => handleClosePreviewDialog(true)} color="primary" autoFocus>
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para abrir PDF */}
      <Dialog
        open={pdfDialog}
        onClose={() => handleClosePdfDialog(false)}
      >
        <DialogTitle>PDF Generado Correctamente</DialogTitle>
        <DialogContent>
          <DialogContentText>
            El PDF del certificado ha sido generado correctamente.
            ¿Desea abrirlo ahora?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClosePdfDialog(false)} color="primary">
            No
          </Button>
          <Button onClick={() => handleClosePdfDialog(true)} color="primary" autoFocus>
            Sí, Abrir PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateForm;
