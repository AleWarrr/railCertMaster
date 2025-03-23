import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
  FormHelperText,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
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
  Add as AddIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddAttachmentIcon,
  FileUpload as FileUploadIcon,
  FileCopy as FileCopyIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { MATERIAL_TYPES, getMaterialTemplate } from '../utils/materialTemplates';
import AttachmentManager from './AttachmentManager';
import NeedlesForm from './NeedlesForm';
import {
  getCompanies,
  getCertificate,
  createCertificate,
  updateCertificate,
  getNeedleTypes,
  getCustomers,
  getInspectors,
  getNeedleInventory,
  getNeedleInventoryByCompanyId,
  getCustomersByCompanyId,
  getCurrentUser
} from '../utils/api';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`certificado-tabpanel-${index}`}
      aria-labelledby={`certificado-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CertificateForm = ({ initialMaterialType }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [materialType, setMaterialType] = useState(initialMaterialType || '');
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [discardDialog, setDiscardDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [pdfDialog, setPdfDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const { control, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      id: '',
      certificateNumber: '',
      materialType: '',
      customerName: '',
      customerReference: '',
      batchNumber: '',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      testResults: [],
      chemicalComposition: [],
      mechanicalProperties: [],
      comments: '',
      attachments: [],
      selectedNeedles: []
    }
  });

  // Watch for material type changes
  const watchMaterialType = watch('materialType');
  
  // Field arrays for repeatable sections
  const { fields: testResultsFields, append: appendTestResult, remove: removeTestResult } = 
    useFieldArray({ control, name: 'testResults' });
  
  const { fields: chemicalFields, append: appendChemical, remove: removeChemical } = 
    useFieldArray({ control, name: 'chemicalComposition' });
  
  const { fields: mechanicalFields, append: appendMechanical, remove: removeMechanical } = 
    useFieldArray({ control, name: 'mechanicalProperties' });
  
  const { fields: attachmentsFields, append: appendAttachment, remove: removeAttachment } = 
    useFieldArray({ control, name: 'attachments' });

  // Para gestionar agujas seleccionadas
  const { fields: needleFields, append: appendNeedle, remove: removeNeedle } = 
    useFieldArray({ control, name: 'selectedNeedles' });

  // Añadir estados para clientes e inspectores
  const [customers, setCustomers] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [needleTypes, setNeedleTypes] = useState([]);
  const [needleInventory, setNeedleInventory] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    inspectorId: '',
    testDate: '',
    issueDate: '',
    materialType: '',
    // Otros campos iniciales
  });
  
  // Función para generar número de certificado para agujas
  const generateNeedleCertificateNumber = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AG-${year}${month}-${random}`;
  };
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Initialize form with materialType if provided
  useEffect(() => {
    if (initialMaterialType && !isEditMode) {
      setValue('materialType', initialMaterialType);
      
      // Generar número de certificado automáticamente para agujas si viene preseleccionado
      if (initialMaterialType === 'aguja') {
        const certNumber = generateNeedleCertificateNumber();
        setValue('certificateNumber', certNumber);
        
        // Inicializar el array de agujas seleccionadas
        setValue('selectedNeedles', [{ needleId: '' }]);
        
        // Inicializar campos de archivos adjuntos específicos para agujas
        setValue('attachments.templatePdf', null);
        setValue('attachments.hardnessTestPdf', null);
        setValue('attachments.particleTestPdf', null);
      }
    }
  }, [initialMaterialType, setValue, isEditMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener datos para dropdowns
        const needleTypesData = await getNeedleTypes();
        setNeedleTypes(needleTypesData || []);
        
        // Obtener información del usuario actual
        const currentUser = getCurrentUser();
        
        // Obtener inspectores
        const inspectorsData = await getInspectors();
        setInspectors(Array.isArray(inspectorsData) ? inspectorsData : []);

        // Obtener empresas
        const companiesData = await getCompanies();
        if (Array.isArray(companiesData) && companiesData.length > 0) {
          setCompanyProfile(companiesData[0]);
        }
        
        // Cargar agujas según el fabricante del usuario
        if (currentUser && currentUser.company && currentUser.company.id) {
          // Si el usuario tiene una empresa asociada, obtener sus agujas por ID de empresa
          const needleInventoryData = await getNeedleInventoryByCompanyId(currentUser.company.id);
          setNeedleInventory(Array.isArray(needleInventoryData) ? needleInventoryData : []);
          console.log('Agujas de la empresa cargadas:', needleInventoryData);
        } else if (currentUser && currentUser.fabricante_id) {
          // Alternativa: si el usuario tiene fabricante_id
          const needleInventoryData = await getNeedleInventoryByCompanyId(currentUser.fabricante_id);
          setNeedleInventory(Array.isArray(needleInventoryData) ? needleInventoryData : []);
          console.log('Agujas de la empresa cargadas (por fabricante_id):', needleInventoryData);
        } else {
          // Si no hay empresa asociada, cargar todas las agujas
          const needleInventoryData = await getNeedleInventory();
          setNeedleInventory(Array.isArray(needleInventoryData) ? needleInventoryData : []);
          console.log('Todas las agujas cargadas (sin filtro de empresa)');
        }
        
        // Cargar clientes según el fabricante del usuario
        let customersData;
        if (currentUser && currentUser.fabricante_id) {
          // Si el usuario tiene un fabricante asociado, obtener sus clientes
          customersData = await getCustomersByCompanyId(currentUser.fabricante_id);
          console.log('Clientes del fabricante cargados:', customersData);
        } else {
          // Si no, cargar todos los clientes (solo para administradores)
          customersData = await getCustomers();
          console.log('Todos los clientes cargados:', customersData);
        }
        setCustomers(Array.isArray(customersData) ? customersData : []);

        // Si hay un ID de certificado, cargar datos
        if (id) {
          try {
            const certificateResponse = await getCertificate(id);
            if (certificateResponse.success && certificateResponse.data) {
              const certificateData = certificateResponse.data;
              // Convertir fechas a formato local
              let formattedData = {
                ...certificateData,
                testDate: certificateData.test_date ? new Date(certificateData.test_date).toISOString().split('T')[0] : '',
                issueDate: certificateData.issue_date ? new Date(certificateData.issue_date).toISOString().split('T')[0] : ''
              };
              setFormData(formattedData);
              if (formattedData.material_type) {
                setMaterialType(formattedData.material_type);
              }
            } else {
              setSnackbar({
                open: true,
                message: "No se encontró el certificado solicitado",
                severity: 'error'
              });
            }
          } catch (error) {
            console.error("Error al cargar el certificado:", error);
            setSnackbar({
              open: true,
              message: `Error al cargar el certificado: ${error.message}`,
              severity: 'error'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los datos',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Update form fields when material type changes
  useEffect(() => {
    console.log("Material Type Changed:", watchMaterialType);
    
    if (watchMaterialType && watchMaterialType !== materialType) {
      const template = getMaterialTemplate(watchMaterialType);
      setMaterialType(watchMaterialType);
      
      // Clear existing arrays
      setValue('testResults', []);
      setValue('chemicalComposition', []);
      setValue('mechanicalProperties', []);
      
      // Limpiar archivos adjuntos específicos
      setValue('attachments.templatePdf', null);
      setValue('attachments.hardnessTestPdf', null);
      setValue('attachments.particleTestPdf', null);
      
      // Generar número de certificado automáticamente para agujas
      if (watchMaterialType === 'aguja' && !isEditMode) {
        const certNumber = generateNeedleCertificateNumber();
        setValue('certificateNumber', certNumber);
        
        // Inicializar el array de agujas seleccionadas
        setValue('selectedNeedles', [{ needleId: '' }]);
      } else {
        // Limpiar las agujas seleccionadas si no es tipo aguja
        setValue('selectedNeedles', []);
      }
      
      // Add template fields
      if (template) {
        // Add test result templates
        if (template.testResults) {
          template.testResults.forEach(test => {
            appendTestResult({ name: test.name, standardValue: test.standardValue, actualValue: '', unit: test.unit });
          });
        }
        
        // Add chemical composition templates
        if (template.chemicalComposition) {
          template.chemicalComposition.forEach(element => {
            appendChemical({ element: element.name, minValue: element.minValue, maxValue: element.maxValue, actualValue: '', unit: element.unit });
          });
        }
        
        // Add mechanical property templates
        if (template.mechanicalProperties) {
          template.mechanicalProperties.forEach(property => {
            appendMechanical({ property: property.name, requiredValue: property.requiredValue, actualValue: '', unit: property.unit });
          });
        }
      }
    }
  }, [watchMaterialType, materialType, appendTestResult, appendChemical, appendMechanical, setValue, isEditMode]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddAttachment = async () => {
    try {
      const result = await window.api.openFileDialog();
      
      if (result.success && !result.canceled) {
        appendAttachment({
          id: uuidv4(),
          name: result.fileName,
          path: result.filePath,
          fileData: result.fileBuffer
        });
        
        setSnackbar({
          open: true,
          message: 'Adjunto añadido correctamente',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      setSnackbar({
        open: true,
        message: `Error al añadir adjunto: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleSaveCertificate = async (data) => {
    try {
      setSaving(true);
      
      // Make sure company data is included
      data.companyInfo = companyProfile;
      
      // Save certificate
      const result = await window.api.saveCertificate(data);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Certificado guardado correctamente',
          severity: 'success'
        });
        
        // If it's a new certificate, navigate to edit mode
        if (!isEditMode) {
          navigate(`/certificados/${data.id}`);
        }
      } else {
        throw new Error(result.error || 'Error al guardar el certificado');
      }
    } catch (error) {
      console.error('Error saving certificate:', error);
      setSnackbar({
        open: true,
        message: `Error al guardar el certificado: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setDiscardDialog(true);
    } else {
      navigate('/certificados');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePreview = () => {
    setPreviewDialog(true);
  };

  const handleNavigateToPreview = async (data) => {
    // Save first, then navigate to preview
    await handleSaveCertificate(data);
    navigate(`/certificados/preview/${data.id}`);
  };

  // Handle adding a new needle
  const handleAddNeedle = () => {
    const needles = watch('selectedNeedles') || [];
    if (needles.length < 10) {
      appendNeedle({ needleId: '' });
    } else {
      setSnackbar({
        open: true,
        message: 'No se pueden agregar más de 10 agujas',
        severity: 'warning'
      });
    }
  };

  // Handle removing a needle
  const handleRemoveNeedle = (index) => {
    removeNeedle(index);
  };

  // Finalizar certificado y generar PDF
  const handleFinalizeCertificate = async (data) => {
    try {
      // Establecer el estado como "final" siempre
      data.status = 'final';
      
      setSaving(true);
      
      // Incluir datos de la empresa
      data.companyInfo = companyProfile;
      
      // Guardar certificado con estado final
      const result = await window.api.saveCertificate(data);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Certificado finalizado correctamente',
          severity: 'success'
        });
        
        // Generar PDF
        await handleGeneratePDF(data.id);
        
      } else {
        throw new Error(result.error || 'Error al finalizar el certificado');
      }
    } catch (error) {
      console.error('Error finalizing certificate:', error);
      setSnackbar({
        open: true,
        message: `Error al finalizar el certificado: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Generar PDF del certificado
  const handleGeneratePDF = async (certificateId) => {
    try {
      const id = certificateId || watch('id');
      if (!id) {
        throw new Error('ID de certificado no disponible');
      }
      
      // Llamar a la API para generar el PDF
      const result = await window.api.generateCertificatePDF(id);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'PDF generado correctamente',
          severity: 'success'
        });
        
        // Mostrar diálogo para abrir el PDF
        setPdfDialog(true);
        
      } else {
        throw new Error(result.error || 'Error al generar el PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({
        open: true,
        message: `Error al generar el PDF: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Función para renderizar componentes específicos según el tipo de material
  const renderMaterialSpecificFields = (materialType) => {
    switch (materialType) {
      case 'aguja':
        return (
          <Grid item xs={12}>
            <NeedlesForm 
              control={control} 
              errors={errors} 
              watch={watch} 
              setValue={setValue} 
              getMaterialTemplate={getMaterialTemplate}
              onNext={handleNext}
              hideComments={true}
            />
          </Grid>
        );
        
      case 'rail':
        return (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Información de Rieles
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Alert severity="info">
              Se incluirá formulario específico para certificación de rieles.
            </Alert>
          </Grid>
        );
        
      case 'sleeper':
        return (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Información de Traviesas
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Alert severity="info">
              Se incluirá formulario específico para certificación de traviesas.
            </Alert>
          </Grid>
        );
      
      default:
        return null;
    }
  };

  // Función para renderizar sección de archivos adjuntos específicos según tipo de material
  const renderAttachmentFields = (materialType) => {
    switch (materialType) {
      case 'aguja':
        return (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Documentos Requeridos para Agujas
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="attachments.templatePdf"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>PDF Planilla</Typography>
                      {field.value ? (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <FileCopyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="body2" noWrap>{field.value.name}</Typography>
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={() => setValue('attachments.templatePdf', null)}
                          >
                            Eliminar
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<FileUploadIcon />}
                          onClick={async () => {
                            try {
                              const result = await window.api.openFileDialog({ 
                                filters: [{ name: 'PDF', extensions: ['pdf'] }]
                              });
                              if (result.success && !result.canceled) {
                                setValue('attachments.templatePdf', {
                                  id: uuidv4(),
                                  name: result.fileName,
                                  path: result.filePath,
                                  fileData: result.fileBuffer,
                                  type: 'templatePdf'
                                });
                              }
                            } catch (error) {
                              console.error('Error al subir PDF:', error);
                            }
                          }}
                        >
                          Subir PDF
                        </Button>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="attachments.hardnessTestPdf"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>PDF Ensayo Dureza</Typography>
                      {field.value ? (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <FileCopyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="body2" noWrap>{field.value.name}</Typography>
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={() => setValue('attachments.hardnessTestPdf', null)}
                          >
                            Eliminar
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<FileUploadIcon />}
                          onClick={async () => {
                            try {
                              const result = await window.api.openFileDialog({ 
                                filters: [{ name: 'PDF', extensions: ['pdf'] }]
                              });
                              if (result.success && !result.canceled) {
                                setValue('attachments.hardnessTestPdf', {
                                  id: uuidv4(),
                                  name: result.fileName,
                                  path: result.filePath,
                                  fileData: result.fileBuffer,
                                  type: 'hardnessTestPdf'
                                });
                              }
                            } catch (error) {
                              console.error('Error al subir PDF:', error);
                            }
                          }}
                        >
                          Subir PDF
                        </Button>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="attachments.particleTestPdf"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>PDF Ensayo Partículas</Typography>
                      {field.value ? (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <FileCopyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="body2" noWrap>{field.value.name}</Typography>
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={() => setValue('attachments.particleTestPdf', null)}
                          >
                            Eliminar
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<FileUploadIcon />}
                          onClick={async () => {
                            try {
                              const result = await window.api.openFileDialog({ 
                                filters: [{ name: 'PDF', extensions: ['pdf'] }]
                              });
                              if (result.success && !result.canceled) {
                                setValue('attachments.particleTestPdf', {
                                  id: uuidv4(),
                                  name: result.fileName,
                                  path: result.filePath,
                                  fileData: result.fileBuffer,
                                  type: 'particleTestPdf'
                                });
                              }
                            } catch (error) {
                              console.error('Error al subir PDF:', error);
                            }
                          }}
                        >
                          Subir PDF
                        </Button>
                      )}
                    </Box>
                  )}
                />
              </Grid>
            </Grid>
          </>
        );
      case 'rail':
        return (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Documentos para Rieles
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Se configurarán los documentos específicos para rieles.
            </Alert>
          </>
        );
      case 'sleeper':
        return (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Documentos para Traviesas
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Se configurarán los documentos específicos para traviesas.
            </Alert>
          </>
        );
      default:
        return (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Archivos Adjuntos
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {renderAttachmentFields(watchMaterialType)}
          </>
        );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Steps for the stepper
  const steps = [
    'Información Básica',
    'Información Adicional'
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', sm: 'center' }} mb={3} gap={2}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Editar Certificado' : 'Crear Nuevo Certificado'}
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Button
            variant="outlined"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
          >
            Vista Previa
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit(handleSaveCertificate)}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          {isEditMode && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<FileUploadIcon />}
                onClick={handleSubmit(handleFinalizeCertificate)}
                disabled={saving}
              >
                Finalizar Certificado
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<FileCopyIcon />}
                onClick={() => handleGeneratePDF()}
                disabled={saving}
              >
                Generar PDF
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel 
            orientation={window.innerWidth < 600 ? "vertical" : "horizontal"}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
      
      <form>
        {/* Step 1: Basic Information */}
        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="certificateNumber"
                    control={control}
                    rules={{ required: 'El número de certificado es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Número de Certificado"
                        fullWidth
                        variant="outlined"
                        error={!!errors.certificateNumber}
                        helperText={errors.certificateNumber?.message}
                        disabled={watchMaterialType === 'aguja'} // Deshabilitado si es tipo aguja
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="date"
                    control={control}
                    rules={{ required: 'La fecha es requerida' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Fecha del Certificado"
                        type="date"
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.date}
                        helperText={errors.date?.message}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="materialType"
                    control={control}
                    rules={{ required: 'El tipo de material es requerido' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.materialType}>
                        <InputLabel id="material-type-label">Tipo de Material</InputLabel>
                        <Select
                          {...field}
                          labelId="material-type-label"
                          label="Tipo de Material"
                          disabled={!!initialMaterialType}
                        >
                          {MATERIAL_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.materialType && (
                          <FormHelperText>{errors.materialType.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="batchNumber"
                    control={control}
                    rules={{ required: 'El número de lote es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Número de Lote"
                        fullWidth
                        variant="outlined"
                        error={!!errors.batchNumber}
                        helperText={errors.batchNumber?.message}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Información del Cliente
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    name="customerId"
                    label="Cliente"
                    value={formData.customerId || ''}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={errors.customerId}
                    helperText={errors.customerId ? 'Por favor seleccione un cliente' : ''}
                  >
                    <MenuItem value="">Seleccione un cliente</MenuItem>
                    {customers.map(customer => (
                      <MenuItem key={customer.id} value={customer.id}>{customer.nombre}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                {/* Reemplazar los campos de inspector con selección de inspector */}
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    name="inspectorId"
                    label="Inspector"
                    value={formData.inspectorId || ''}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={errors.inspectorId}
                    helperText={errors.inspectorId ? 'Por favor seleccione un inspector' : ''}
                  >
                    <MenuItem value="">Seleccione un inspector</MenuItem>
                    {inspectors.map(inspector => (
                      <MenuItem key={inspector.id} value={inspector.id}>{inspector.nombre} ({inspector.codigo_inspector})</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                {/* Mostrar información del cliente e inspector en una fila */}
                <Grid container item xs={12} spacing={3}>
                  {/* Información del cliente */}
                  <Grid item xs={12} md={6}>
                    {formData.customerId && (
                      <>
                        <Typography variant="subtitle2" color="textSecondary">
                          Información del Cliente:
                        </Typography>
                        {customers.filter(c => c.id === parseInt(formData.customerId)).map(customer => (
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
                      </>
                    )}
                  </Grid>
                  
                  {/* Información del inspector */}
                  <Grid item xs={12} md={6}>
                    {formData.inspectorId && (
                      <>
                        <Typography variant="subtitle2" color="textSecondary">
                          Información del Inspector:
                        </Typography>
                        {inspectors.filter(i => i.id === parseInt(formData.inspectorId)).map(inspector => (
                          <Box key={inspector.id} sx={{ ml: 2, mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Código:</strong> {inspector.codigo_inspector || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Email:</strong> {inspector.email || 'No disponible'}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={handleNext}
              >
                Siguiente
              </Button>
            </Box>
          </Card>
        )}
        
        {/* Step 2: Additional Information */}
        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                {/* Campos específicos según el tipo de material */}
                {renderMaterialSpecificFields(watchMaterialType)}
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Archivos Adjuntos
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  {renderAttachmentFields(watchMaterialType)}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Observaciones
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Controller
                    name="comments"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Observaciones"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PrevIcon />}
                onClick={handleBack}
              >
                Atrás
              </Button>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  endIcon={<SaveIcon />}
                  onClick={handleSubmit(handleSaveCertificate)}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Certificado'}
                </Button>
                
                {isEditMode && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      endIcon={<FileUploadIcon />}
                      onClick={handleSubmit(handleFinalizeCertificate)}
                      disabled={saving}
                    >
                      Finalizar
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      endIcon={<FileCopyIcon />}
                      onClick={() => handleGeneratePDF()}
                      disabled={saving}
                    >
                      PDF
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Card>
        )}
      </form>
      
      {/* Discard Changes Dialog */}
      <Dialog
        open={discardDialog}
        onClose={() => setDiscardDialog(false)}
      >
        <DialogTitle>¿Descartar Cambios?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tienes cambios sin guardar. ¿Estás seguro de que quieres descartarlos?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardDialog(false)}>Cancelar</Button>
          <Button 
            onClick={() => {
              setDiscardDialog(false);
              navigate('/certificados');
            }} 
            color="error"
          >
            Descartar Cambios
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generar Vista Previa del Certificado</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Quieres guardar tus cambios y ver la vista previa del certificado?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Cancelar</Button>
          <Button 
            onClick={() => {
              setPreviewDialog(false);
              handleSubmit(handleNavigateToPreview)();
            }} 
            color="primary"
            variant="contained"
          >
            Guardar y Ver Vista Previa
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* PDF Dialog */}
      <Dialog
        open={pdfDialog}
        onClose={() => setPdfDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>PDF del Certificado Generado</DialogTitle>
        <DialogContent>
          <DialogContentText>
            El PDF del certificado ha sido generado correctamente. ¿Qué deseas hacer?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfDialog(false)}>Cerrar</Button>
          <Button
            onClick={async () => {
              setPdfDialog(false);
              // Abrir el PDF
              const id = watch('id');
              if (id) {
                try {
                  await window.api.openCertificatePDF(id);
                } catch (error) {
                  console.error('Error al abrir el PDF:', error);
                  setSnackbar({
                    open: true,
                    message: `Error al abrir el PDF: ${error.message}`,
                    severity: 'error'
                  });
                }
              }
            }}
            color="primary"
            variant="contained"
          >
            Abrir PDF
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

export default CertificateForm;
