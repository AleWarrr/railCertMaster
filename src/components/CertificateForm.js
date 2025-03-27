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
  Checkbox,
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
      selectedNeedles: [],
      hardnessTestPdfs: [],
      particleTestPdfs: []
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

  // Field arrays para los PDFs múltiples
  const { fields: hardnessTestPdfsFields, append: appendHardnessTestPdf, remove: removeHardnessTestPdf } = 
    useFieldArray({ control, name: 'hardnessTestPdfs' });
  
  const { fields: particleTestPdfsFields, append: appendParticleTestPdf, remove: removeParticleTestPdf } = 
    useFieldArray({ control, name: 'particleTestPdfs' });

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
        setValue('hardnessTestPdfs', []); // Inicializar como array vacío
        setValue('particleTestPdfs', []); // Inicializar como array vacío
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
      setValue('hardnessTestPdfs', []); // Limpiar los PDFs de dureza
      setValue('particleTestPdfs', []); // Limpiar los PDFs de partículas
      
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

  // Inicializar properties de asociación de PDFs en las agujas
  useEffect(() => {
    const needles = watch('selectedNeedles') || [];
    const updatedNeedles = needles.map(needle => {
      // Asegurar que cada aguja tenga propiedades para la asociación de PDFs
      if (!needle.hasOwnProperty('hardnessTestPdfId')) {
        needle.hardnessTestPdfId = '';
      }
      if (!needle.hasOwnProperty('particleTestPdfId')) {
        needle.particleTestPdfId = '';
      }
      return needle;
    });
    
    if (JSON.stringify(needles) !== JSON.stringify(updatedNeedles)) {
      setValue('selectedNeedles', updatedNeedles);
    }
  }, [watch('selectedNeedles')]);

  // Sincronizar needles con selectedNeedles y viceversa
  useEffect(() => {
    // Verificar si se están utilizando los campos de NeedlesForm (que usa 'needles')
    const needles = watch('needles') || [];
    const selectedNeedles = watch('selectedNeedles') || [];
    
    if (needles.length > 0) {
      // Añadir propiedades hardnessTestPdfId y particleTestPdfId a las agujas
      const updatedNeedles = needles.map(needle => {
        if (!needle.hasOwnProperty('hardnessTestPdfId')) {
          needle.hardnessTestPdfId = '';
        }
        if (!needle.hasOwnProperty('particleTestPdfId')) {
          needle.particleTestPdfId = '';
        }
        return needle;
      });
      
      // Actualizar selectedNeedles con las agujas modificadas
      setValue('selectedNeedles', updatedNeedles);
      console.log('Agujas actualizadas desde needles:', updatedNeedles);
    } 
    // Si no hay needles pero hay selectedNeedles, sincronizar en dirección opuesta
    else if (selectedNeedles.length > 0 && needles.length === 0) {
      setValue('needles', selectedNeedles);
      console.log('Agujas actualizadas desde selectedNeedles:', selectedNeedles);
    }
  }, [watch('needles')]);

  // Actualizar la interfaz cuando se añadan PDFs
  useEffect(() => {
    // Observar cambios en los PDFs de dureza
    const hardnessTestPdfs = watch('hardnessTestPdfs') || [];
    const needles = watch('needles') || [];
    
    if (hardnessTestPdfs.length > 0 && needles.length > 0) {
      // Forzar renderizado de la matriz cuando cambian los PDFs
      // Esto es importante para que la interfaz se actualice correctamente
      const updatedNeedles = [...needles];
      setValue('needles', updatedNeedles);
    }
  }, [watch('hardnessTestPdfs')]);

  // Actualizar la interfaz cuando se añadan PDFs de partículas
  useEffect(() => {
    // Observar cambios en los PDFs de partículas
    const particleTestPdfs = watch('particleTestPdfs') || [];
    const needles = watch('needles') || [];
    
    if (particleTestPdfs.length > 0 && needles.length > 0) {
      // Forzar renderizado de la matriz cuando cambian los PDFs
      const updatedNeedles = [...needles];
      setValue('needles', updatedNeedles);
    }
  }, [watch('particleTestPdfs')]);

  // Actualizar la interfaz cuando cambian las agujas seleccionadas y ya hay PDFs subidos
  useEffect(() => {
    const needles = watch('needles') || [];
    const hardnessTestPdfs = watch('hardnessTestPdfs') || [];
    const particleTestPdfs = watch('particleTestPdfs') || [];
    
    // Si hay una selección nueva de agujas después de haber subido PDFs
    if (needles.some(n => n.serial_number) && (hardnessTestPdfs.length > 0 || particleTestPdfs.length > 0)) {
      // Forzar actualización para que se muestre correctamente la matriz
      const updatedNeedles = needles.map(needle => {
        if (!needle.hasOwnProperty('hardnessTestPdfId')) {
          needle.hardnessTestPdfId = '';
        }
        if (!needle.hasOwnProperty('particleTestPdfId')) {
          needle.particleTestPdfId = '';
        }
        return needle;
      });
      
      // Actualizar ambos arrays para mantener la sincronización
      setValue('needles', updatedNeedles);
      setValue('selectedNeedles', updatedNeedles);
    }
  }, [watch('needles')?.some(n => n.serial_number)]);

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
      console.log('Datos a guardar:', data);
      
      // Validar que las agujas tengan PDFs asignados
      if (watchMaterialType === 'aguja' && data.needles && data.needles.length > 0) {
        const needlesWithoutPdfs = data.needles.filter(needle => 
          !needle.hardnessTestPdfId && !needle.particleTestPdfId && 
          needle.serial_number // Solo validar agujas que han sido seleccionadas
        );
        
        if (needlesWithoutPdfs.length > 0) {
          console.warn('Hay agujas sin PDFs asignados:', needlesWithoutPdfs);
          // Opcional: mostrar una advertencia al usuario
          // No bloquearemos el guardado, pero es bueno informar
        }
      }
      
      // Preparar datos para enviar al servidor
      const formData = {
        ...data,
        // Construir el objeto con los múltiples PDFs y sus asociaciones
        attachments: {
          ...(data.attachments || {}),
          templatePdf: data.attachments?.templatePdf || null,
          hardnessTestPdfs: data.hardnessTestPdfs || [],
          particleTestPdfs: data.particleTestPdfs || []
        },
        // Asegurar que las asociaciones de agujas con PDFs se guarden correctamente
        needlesPdfAssociations: (data.needles || [])
          .filter(needle => needle.serial_number) // Solo procesar agujas seleccionadas
          .map(needle => ({
            needleId: needle.serial_number,
            hardnessTestPdfId: needle.hardnessTestPdfId || null,
            particleTestPdfId: needle.particleTestPdfId || null
          }))
      };
      
      // Make sure company data is included
      formData.companyInfo = companyProfile;
      
      // Save certificate
      const result = await window.api.saveCertificate(formData);
      
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

  // Función para añadir un PDF de dureza
  const handleAddHardnessTestPdf = async () => {
    try {
      const result = await window.api.openFileDialog({ 
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      });
      if (result.success && !result.canceled) {
        const newPdf = {
          id: uuidv4(),
          name: result.fileName,
          path: result.filePath,
          fileData: result.fileBuffer,
          type: 'hardnessTestPdf'
        };
        appendHardnessTestPdf(newPdf);
        
        // También actualizamos la interfaz forzando un renderizado
        // Intentar usar needles primero, luego selectedNeedles como respaldo
        const formNeedles = watch('needles') || [];
        const selectedNeedles = watch('selectedNeedles') || [];
        
        // Asegurarnos de que ambos arrays estén sincronizados
        if (formNeedles.length > 0) {
          // Forzar actualización para que se muestre la matriz de asignación
          const updatedNeedles = [...formNeedles];
          setValue('needles', updatedNeedles);
          setValue('selectedNeedles', updatedNeedles);
        } else if (selectedNeedles.length > 0) {
          // Si solo hay selectedNeedles, sincronizar con needles
          setValue('needles', selectedNeedles);
        }
        
        // Mostrar mensaje de éxito
        setSnackbar({
          open: true,
          message: 'PDF de ensayo de dureza añadido correctamente',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error al subir PDF:', error);
      setSnackbar({
        open: true,
        message: `Error al subir PDF: ${error.message}`,
        severity: 'error'
      });
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
          id: uuidv4(),
          name: result.fileName,
          path: result.filePath,
          fileData: result.fileBuffer,
          type: 'particleTestPdf'
        };
        appendParticleTestPdf(newPdf);
        
        // También actualizamos la interfaz forzando un renderizado
        // Intentar usar needles primero, luego selectedNeedles como respaldo
        const formNeedles = watch('needles') || [];
        const selectedNeedles = watch('selectedNeedles') || [];
        
        // Asegurarnos de que ambos arrays estén sincronizados
        if (formNeedles.length > 0) {
          // Forzar actualización para que se muestre la matriz de asignación
          const updatedNeedles = [...formNeedles];
          setValue('needles', updatedNeedles);
          setValue('selectedNeedles', updatedNeedles);
        } else if (selectedNeedles.length > 0) {
          // Si solo hay selectedNeedles, sincronizar con needles
          setValue('needles', selectedNeedles);
        }
        
        // Mostrar mensaje de éxito
        setSnackbar({
          open: true,
          message: 'PDF de ensayo de partículas añadido correctamente',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error al subir PDF:', error);
      setSnackbar({
        open: true,
        message: `Error al subir PDF: ${error.message}`,
        severity: 'error'
      });
    }
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

  // Función para renderizar la matriz de asignación de PDFs a agujas
  const renderPdfAssignmentMatrix = () => {
    // Intentar usar needles primero, luego selectedNeedles como respaldo
    const formNeedles = watch('needles') || [];
    const selectedNeedles = watch('selectedNeedles') || [];
    
    // Usar el array que tenga datos de agujas
    const needles = formNeedles.length > 0 ? formNeedles : selectedNeedles;
    
    // Verificar si hay agujas seleccionadas con serial_number
    const hasSelectedNeedles = needles.some(needle => needle.serial_number);
    
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

    // Función para renderizar el selector múltiple de agujas para un PDF
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
    
    return (
      <Box sx={{ mt: 2, mb: 3 }}>
        <Grid container spacing={3}>
          {/* PDFs de Ensayo Dureza */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              PDFs de Ensayo Dureza
            </Typography>
            
            {hardnessTestPdfsFields.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No hay PDFs de ensayo de dureza añadidos. Súbelos primero para asignarlos a las agujas.
              </Alert>
            ) : (
              <Box>
                {hardnessTestPdfsFields.map((pdf, index) => (
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
                
                {/* Botón para asignar todas las agujas a un PDF */}
                {hardnessTestPdfsFields.length === 1 && hasSelectedNeedles && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                      const pdfId = hardnessTestPdfsFields[0].id;
                      const updatedNeedles = needles.map(needle => ({
                        ...needle,
                        hardnessTestPdfId: needle.serial_number ? pdfId : ''
                      }));
                      setValue('needles', updatedNeedles);
                      setValue('selectedNeedles', updatedNeedles);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Asignar todas las agujas a este PDF
                  </Button>
                )}
              </Box>
            )}
          </Grid>
          
          {/* PDFs de Ensayo Partículas */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              PDFs de Ensayo Partículas
            </Typography>
            
            {particleTestPdfsFields.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No hay PDFs de ensayo de partículas añadidos. Súbelos primero para asignarlos a las agujas.
              </Alert>
            ) : (
              <Box>
                {particleTestPdfsFields.map((pdf, index) => (
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
                
                {/* Botón para asignar todas las agujas a un PDF */}
                {particleTestPdfsFields.length === 1 && hasSelectedNeedles && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                      const pdfId = particleTestPdfsFields[0].id;
                      const updatedNeedles = needles.map(needle => ({
                        ...needle,
                        particleTestPdfId: needle.serial_number ? pdfId : ''
                      }));
                      setValue('needles', updatedNeedles);
                      setValue('selectedNeedles', updatedNeedles);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Asignar todas las agujas a este PDF
                  </Button>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    );
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
            
            {/* Mostrar la matriz de asignación siempre que haya PDFs subidos */}
            {(hardnessTestPdfsFields.length > 0 || particleTestPdfsFields.length > 0) ? (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Asignación de PDFs a Agujas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {renderPdfAssignmentMatrix()}
              </>
            ) : null}
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
  const renderAttachmentFields = (type) => {
    switch (type) {
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
                <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">PDFs Ensayo Dureza</Typography>
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
                    <Typography variant="subtitle2">PDFs Ensayo Partículas</Typography>
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

  // Función para manejar la eliminación de un PDF de dureza
  const handleRemoveHardnessTestPdf = (index) => {
    // Obtener el ID del PDF que vamos a eliminar
    const pdfToRemove = hardnessTestPdfsFields[index];
    
    // Eliminar el PDF del array
    removeHardnessTestPdf(index);
    
    // Si el PDF estaba asignado a alguna aguja, actualizar las asignaciones
    if (pdfToRemove) {
      // Intentar usar needles primero, luego selectedNeedles como respaldo
      const formNeedles = watch('needles') || [];
      const selectedNeedles = watch('selectedNeedles') || [];
      
      // Usar el array que tenga datos de agujas
      const needles = formNeedles.length > 0 ? formNeedles : selectedNeedles;
      
      const updatedNeedles = needles.map(needle => {
        // Si la aguja tiene asignado este PDF, quitarlo
        if (needle.hardnessTestPdfId === pdfToRemove.id) {
          return { ...needle, hardnessTestPdfId: '' };
        }
        return needle;
      });
      
      // Actualizar ambos arrays para mantener la sincronización
      setValue('needles', updatedNeedles);
      setValue('selectedNeedles', updatedNeedles);
      
      // Forzar renderizado
      setTimeout(() => {
        setValue('needles', [...updatedNeedles]);
      }, 0);
    }
    
    // Mostrar mensaje de éxito
    setSnackbar({
      open: true,
      message: 'PDF de ensayo de dureza eliminado correctamente',
      severity: 'success'
    });
  };

  // Función para manejar la eliminación de un PDF de partículas
  const handleRemoveParticleTestPdf = (index) => {
    // Obtener el ID del PDF que vamos a eliminar
    const pdfToRemove = particleTestPdfsFields[index];
    
    // Eliminar el PDF del array
    removeParticleTestPdf(index);
    
    // Si el PDF estaba asignado a alguna aguja, actualizar las asignaciones
    if (pdfToRemove) {
      // Intentar usar needles primero, luego selectedNeedles como respaldo
      const formNeedles = watch('needles') || [];
      const selectedNeedles = watch('selectedNeedles') || [];
      
      // Usar el array que tenga datos de agujas
      const needles = formNeedles.length > 0 ? formNeedles : selectedNeedles;
      
      const updatedNeedles = needles.map(needle => {
        // Si la aguja tiene asignado este PDF, quitarlo
        if (needle.particleTestPdfId === pdfToRemove.id) {
          return { ...needle, particleTestPdfId: '' };
        }
        return needle;
      });
      
      // Actualizar ambos arrays para mantener la sincronización
      setValue('needles', updatedNeedles);
      setValue('selectedNeedles', updatedNeedles);
      
      // Forzar renderizado
      setTimeout(() => {
        setValue('needles', [...updatedNeedles]);
      }, 0);
    }
    
    // Mostrar mensaje de éxito
    setSnackbar({
      open: true,
      message: 'PDF de ensayo de partículas eliminado correctamente',
      severity: 'success'
    });
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
