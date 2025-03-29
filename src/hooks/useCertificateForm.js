import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { 
  getCertificate, 
  getCompanies, 
  getCustomers, 
  getInspectors, 
  getNeedleInventory, 
  getNeedleTypes,
  getCustomersByCompanyId,
  getNeedleInventoryByCompanyId,
  getCurrentUser
} from '../utils/api';
import { getMaterialForm, hasMaterialForm } from '../utils/materialRegistry';
import { MATERIAL_TYPES } from '../utils/materialTemplates';

/**
 * Hook personalizado para manejar la lógica del formulario de certificados
 * 
 * @param {Object} options - Opciones para el hook
 * @param {string} options.initialMaterialType - Tipo de material inicial
 * @returns {Object} - Estado y métodos para el formulario
 */
const useCertificateForm = ({ initialMaterialType } = {}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  // Estados del formulario
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
  
  // Estados para datos auxiliares
  const [customers, setCustomers] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [needleTypes, setNeedleTypes] = useState([]);
  const [needleInventory, setNeedleInventory] = useState([]);
  
  // Configurar el formulario con react-hook-form
  const { 
    control, 
    handleSubmit, 
    setValue, 
    watch, 
    reset, 
    formState: { errors, isDirty } 
  } = useForm({
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

  // Configurar field arrays
  const testResultsArray = useFieldArray({ control, name: 'testResults' });
  const chemicalArray = useFieldArray({ control, name: 'chemicalComposition' });
  const mechanicalArray = useFieldArray({ control, name: 'mechanicalProperties' });
  const attachmentsArray = useFieldArray({ control, name: 'attachments' });
  const needlesArray = useFieldArray({ control, name: 'selectedNeedles' });
  const hardnessTestPdfsArray = useFieldArray({ control, name: 'hardnessTestPdfs' });
  const particleTestPdfsArray = useFieldArray({ control, name: 'particleTestPdfs' });
  
  // Obtener el tipo de material del formulario
  const watchMaterialType = watch('materialType');
  
  // Función para generar número de certificado para agujas
  const generateNeedleCertificateNumber = () => {
    if (hasMaterialForm('aguja')) {
      return getMaterialForm('aguja').generateCertificateNumber();
    }
    
    // Implementación por defecto
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AG-${year}${month}-${random}`;
  };
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener información del usuario actual
        const currentUser = getCurrentUser();
        console.log('Usuario actual:', currentUser);
        
        // Obtener inspectores - cargar todos sin filtro
        const inspectorsData = await getInspectors();
        setInspectors(Array.isArray(inspectorsData) ? inspectorsData : []);
        console.log('Inspectores cargados:', inspectorsData);

        // Obtener empresas
        const companiesData = await getCompanies();
        if (Array.isArray(companiesData) && companiesData.length > 0) {
          setCompanyProfile(companiesData[0]);
        }
        
        // Cargar clientes - siempre cargar todos los disponibles
        let customersData = await getCustomers();
        console.log('Todos los clientes cargados:', customersData);
        
        // Si hay fabricante_id en el usuario, filtrar los clientes
        if (currentUser && currentUser.fabricante_id) {
          try {
            // También cargar clientes específicos del fabricante
            const fabricanteClientes = await getCustomersByCompanyId(currentUser.fabricante_id);
            console.log('Clientes del fabricante cargados:', fabricanteClientes);
            
            // Si hay clientes específicos del fabricante, usarlos en su lugar
            if (Array.isArray(fabricanteClientes) && fabricanteClientes.length > 0) {
              customersData = fabricanteClientes;
            }
          } catch (err) {
            console.error('Error al cargar clientes del fabricante:', err);
            // Seguir usando todos los clientes en caso de error
          }
        }
        setCustomers(Array.isArray(customersData) ? customersData : []);
        
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

        // Si hay un ID de certificado, cargar datos
        if (id) {
          try {
            const certificateResponse = await getCertificate(id);
            if (certificateResponse.success && certificateResponse.data) {
              const certificateData = certificateResponse.data;
              
              // Actualizar el formulario con los datos
              Object.entries(certificateData).forEach(([key, value]) => {
                setValue(key, value);
              });
              
              // Establecer el tipo de material
              if (certificateData.materialType) {
                setMaterialType(certificateData.materialType);
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
  }, [id, setValue]);

  // Inicializar con materialType si se proporciona
  useEffect(() => {
    if (initialMaterialType && !isEditMode) {
      setValue('materialType', initialMaterialType);
      
      // Generar número de certificado automáticamente para agujas si viene preseleccionado
      if (initialMaterialType === 'aguja') {
        const certNumber = generateNeedleCertificateNumber();
        setValue('certificateNumber', certNumber);
        
        // Inicializar el array de agujas seleccionadas
        setValue('selectedNeedles', [{ needleId: '' }]);
        setValue('needles', [{ needleId: '' }]);
        
        // Inicializar campos de archivos adjuntos específicos para agujas
        setValue('attachments.templatePdf', null);
        setValue('hardnessTestPdfs', []); 
        setValue('particleTestPdfs', []); 
      }
    }
  }, [initialMaterialType, setValue, isEditMode]);

  // Actualizar campos cuando cambia el tipo de material
  useEffect(() => {
    if (watchMaterialType && watchMaterialType !== materialType) {
      setMaterialType(watchMaterialType);
      
      // Si hay una implementación específica para este tipo de material
      if (hasMaterialForm(watchMaterialType)) {
        const materialForm = getMaterialForm(watchMaterialType);
        
        // Obtener valores por defecto específicos del material
        const defaultValues = materialForm.getDefaultValues();
        
        // Limpiar arrays existentes
        setValue('testResults', []);
        setValue('chemicalComposition', []);
        setValue('mechanicalProperties', []);
        setValue('attachments', {});
        setValue('hardnessTestPdfs', []);
        setValue('particleTestPdfs', []);
        
        // Establecer valores por defecto
        Object.entries(defaultValues).forEach(([key, value]) => {
          setValue(key, value);
        });
        
        // Si es tipo aguja y modo creación, generar número automáticamente
        if (watchMaterialType === 'aguja' && !isEditMode) {
          const certNumber = materialForm.generateCertificateNumber();
          console.log('Generando número de certificado para agujas:', certNumber);
          setValue('certificateNumber', certNumber);
        }
      } else {
        // Limpiar valores si no hay implementación específica
        setValue('selectedNeedles', []);
        setValue('needles', []);
      }
    }
  }, [watchMaterialType, materialType, setValue, isEditMode]);

  // Detectar selección de agujas y actualizar
  const handleNeedleSelection = (fieldIndex, needleId) => {
    console.log(`Aguja seleccionada en campo ${fieldIndex}: ${needleId}`);
    
    // Obtener arrays actuales
    const needles = watch('needles') || [];
    const selectedNeedles = watch('selectedNeedles') || [];
    
    // Actualizar el array de needles
    const updatedNeedles = [...needles];
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

  // Navegación entre pasos
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Manejo de diálogos
  const handleCloseDiscardDialog = (shouldDiscard = false) => {
    setDiscardDialog(false);
    if (shouldDiscard) {
      navigate('/certificados');
    }
  };

  const handleClosePreviewDialog = (shouldPreview = false) => {
    setPreviewDialog(false);
    if (shouldPreview) {
      handleSubmit(handleNavigateToPreview)();
    }
  };

  const handleClosePdfDialog = (shouldOpenPdf = false) => {
    setPdfDialog(false);
    if (shouldOpenPdf) {
      openCertificatePdf();
    }
  };

  // Abrir PDF del certificado
  const openCertificatePdf = async () => {
    const certificateId = watch('id');
    if (certificateId) {
      try {
        await window.api.openCertificatePDF(certificateId);
      } catch (error) {
        console.error('Error al abrir el PDF:', error);
        setSnackbar({
          open: true,
          message: `Error al abrir el PDF: ${error.message}`,
          severity: 'error'
        });
      }
    }
  };

  // Guardar certificado
  const saveCertificate = async (data) => {
    try {
      setSaving(true);
      console.log('Datos a guardar:', data);
      
      // Si hay una implementación específica para este tipo de material, procesar los datos
      let processedData = { ...data };
      if (hasMaterialForm(data.materialType)) {
        processedData = getMaterialForm(data.materialType).processDataBeforeSave(data);
      }
      
      // Asegurar que se incluyan los datos de la empresa
      processedData.companyInfo = companyProfile;
      
      // Guardar certificado
      const result = await window.api.saveCertificate(processedData);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Certificado guardado correctamente',
          severity: 'success'
        });
        
        // Si es un nuevo certificado, navegar al modo edición
        if (!isEditMode) {
          navigate(`/certificados/${data.id || result.id}`);
        }
        
        return result;
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
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  // Navegar a la vista previa
  const handleNavigateToPreview = async (data) => {
    const result = await saveCertificate(data);
    if (result.success) {
      navigate(`/certificados/preview/${data.id || result.id}`);
    }
  };

  // Finalizar certificado
  const finalizeCertificate = async (data) => {
    try {
      // Establecer el estado como "final"
      const finalData = { ...data, status: 'final' };
      
      setSaving(true);
      
      // Guardar con estado final
      const result = await saveCertificate(finalData);
      
      if (result.success) {
        // Generar PDF
        await generateCertificatePdf(data.id || result.id);
        return result;
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
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  // Generar PDF
  const generateCertificatePdf = async (certificateId) => {
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
        
        return result;
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
      return { success: false, error: error.message };
    }
  };

  // Manejo de snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Cancelar edición
  const handleCancel = () => {
    if (isDirty) {
      setDiscardDialog(true);
    } else {
      navigate('/certificados');
    }
  };

  // Retornar todo lo necesario para el componente
  return {
    // Estado del formulario
    form: {
      control,
      handleSubmit,
      setValue,
      watch,
      reset,
      errors,
      isDirty
    },
    
    // Field Arrays
    fieldArrays: {
      testResults: testResultsArray,
      chemicalComposition: chemicalArray,
      mechanicalProperties: mechanicalArray,
      attachments: attachmentsArray,
      needles: needlesArray,
      hardnessTestPdfs: hardnessTestPdfsArray,
      particleTestPdfs: particleTestPdfsArray
    },
    
    // Estado UI
    ui: {
      activeTab,
      setActiveTab,
      activeStep,
      loading,
      saving,
      materialType,
      companyProfile,
      isEditMode,
      
      // Diálogos
      discardDialog,
      previewDialog,
      pdfDialog,
      snackbar,
      setSnackbar,
      
      // Datos
      customers,
      inspectors,
      needleTypes,
      needleInventory,
      
      // Constantes
      materialTypes: MATERIAL_TYPES
    },
    
    // Manejadores
    handlers: {
      handleNext,
      handleBack,
      handleNeedleSelection,
      handleSubmit,
      handleCancel,
      handleCloseSnackbar,
      handleCloseDiscardDialog,
      handleClosePreviewDialog,
      handleClosePdfDialog,
      saveCertificate,
      finalizeCertificate,
      generateCertificatePdf,
      handleNavigateToPreview
    }
  };
};

export default useCertificateForm; 