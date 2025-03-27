import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Button,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { 
  getCompanies, 
  getCustomers, 
  getInspectors,
  getNeedleInventory, 
  getNeedleInventoryByCompanyId,
  getCustomersByCompanyId,
  getCurrentUser
} from '../utils/api';

/**
 * NeedlesForm - Specialized component for handling needle material certifications
 * Manages needle-specific form fields, including needle weld types and customer information
 */
const NeedlesForm = ({ control, errors, watch, setValue, getMaterialTemplate, onNext, hideComments = false }) => {
  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNeedleTypes, setSelectedNeedleTypes] = useState([]);
  const [needleInventory, setNeedleInventory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Cargar el usuario actual
  useEffect(() => {
    const user = getCurrentUser();
    console.log('Usuario obtenido directamente de getCurrentUser():', user);
    setCurrentUser(user);
    if (user && user.fabricante_id) {
      setSelectedCompanyId(user.fabricante_id);
      setValue('companyId', user.fabricante_id);
    }
  }, [setValue]);
  
  // Load data from the database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const user = getCurrentUser();
        console.log('Usuario actual:', user);
        
        // Fetch companies and inspectors in parallel
        const [companiesRes, inspectorsRes] = await Promise.all([
          getCompanies(),
          getInspectors()
        ]);
        
        console.log('Empresas cargadas:', companiesRes);
        console.log('Inspectores cargados:', inspectorsRes);
        
        setCompanies(companiesRes);
        setInspectors(inspectorsRes);
        
        // Cargar las agujas dependiendo del usuario
        let needleInventoryRes = [];
        if (user && user.fabricante_id) {
          const companyId = user.fabricante_id;
          console.log('Cargando agujas para la empresa ID:', companyId);
          needleInventoryRes = await getNeedleInventoryByCompanyId(companyId);
          console.log('Agujas de la empresa cargadas:', needleInventoryRes);
        } else if (user && user.company && user.company.id) {
          const companyId = user.company.id;
          console.log('Cargando agujas para la empresa ID (desde user.company):', companyId);
          needleInventoryRes = await getNeedleInventoryByCompanyId(companyId);
          console.log('Agujas de la empresa cargadas:', needleInventoryRes);
        } else {
          console.log('Cargando todas las agujas (sin filtro de empresa)');
          needleInventoryRes = await getNeedleInventory();
        }
        setNeedleInventory(needleInventoryRes);
        
        // Si el usuario tiene una empresa asociada, cargar sus clientes
        if (user && user.fabricante_id) {
          const companyId = user.fabricante_id;
          console.log('Usuario con empresa asociada, ID:', companyId);
          setSelectedCompanyId(companyId);
          setValue('companyId', companyId);
          
          // Cargar los clientes asociados a esta empresa
          const customersRes = await getCustomersByCompanyId(companyId);
          console.log('Clientes de la empresa cargados:', customersRes);
          setCustomers(customersRes);
          
          // Establecer datos de la empresa
          const company = companiesRes.find(c => c.id === parseInt(companyId));
          if (company) {
            setValue('seller', company.nombre);
            setValue('qualityResponsible', company.responsable_calidad);
            setValue('qualityResponsibleEmail', company.email_responsable_calidad);
            setValue('emittedIn', company.ubicacion);
          }
        } else {
          // Si no tiene empresa asociada, cargar todos los clientes
          const customersRes = await getCustomers();
          console.log('Todos los clientes cargados:', customersRes);
          setCustomers(customersRes);
          
          // Si hay empresas, establecer la primera como predeterminada
          if (companiesRes.length > 0) {
            setSelectedCompanyId(companiesRes[0].id);
            setValue('companyId', companiesRes[0].id);
            setValue('emittedIn', companiesRes[0].ubicacion);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [setValue]);
  
  // Initialize needles from form data if available
  useEffect(() => {
    if (!watch('needles') || watch('needles').length === 0) {
      setValue('needles', [{ serial_number: '' }]);
    }
    
    setSelectedNeedleTypes(watch('needles') || []);
  }, [setValue, watch]);
  
  // Handler when customer changes
  useEffect(() => {
    const customerId = watch('customerId');
    if (customerId) {
      const customer = customers.find(c => c.id === parseInt(customerId));
      if (customer) {
        setSelectedCustomerId(customer.id);
        setValue('customerNumber', customer.customer_number);
      }
    }
  }, [watch('customerId'), customers, setValue]);
  
  // Handler when inspector changes
  useEffect(() => {
    const inspectorId = watch('inspectorId');
    if (inspectorId) {
      const inspector = inspectors.find(i => i.id === parseInt(inspectorId));
      if (inspector) {
        setSelectedInspectorId(inspector.id);
        setValue('inspectorCode', inspector.codigo_inspector);
        setValue('inspectorEmail', inspector.email);
      }
    }
  }, [watch('inspectorId'), inspectors, setValue]);
  
  // Handler when company changes
  useEffect(() => {
    const companyId = watch('companyId');
    if (companyId) {
      console.log('Empresa seleccionada cambió a:', companyId);
      // Actualizar el ID de empresa seleccionada
      setSelectedCompanyId(companyId);
      
      // Buscar la empresa en la lista
      const company = companies.find(c => c.id === parseInt(companyId));
      if (company) {
        console.log('Empresa encontrada:', company);
        setValue('seller', company.nombre);
        setValue('qualityResponsible', company.responsable_calidad);
        setValue('qualityResponsibleEmail', company.email_responsable_calidad);
        setValue('emittedIn', company.ubicacion);
        
        // Cargar los clientes asociados a esta empresa
        const loadCustomers = async () => {
          try {
            console.log('Cargando clientes para la empresa ID:', companyId);
            // Llamar a getCustomersByCompanyId con un valor numérico
            const customersRes = await getCustomersByCompanyId(parseInt(companyId));
            console.log('Clientes recibidos:', customersRes);
            
            // Verificar si la respuesta es un array válido
            if (Array.isArray(customersRes)) {
              setCustomers(customersRes);
              if (customersRes.length === 0) {
                console.warn('No se encontraron clientes para esta empresa');
                setError('No hay clientes asociados a esta empresa. Por favor, contacte al administrador.');
              } else {
                setError(null);
              }
            } else {
              console.error('La respuesta no es un array:', customersRes);
              setError('Error al cargar los clientes. La respuesta del servidor no tiene el formato esperado.');
            }
          } catch (error) {
            console.error('Error loading customers for company:', error);
            setError(`Error al cargar clientes: ${error.message}`);
            setCustomers([]);
          }
        };
        
        loadCustomers();
      }
    }
  }, [watch('companyId'), companies, setValue]);
  
  // Handler for adding a new needle
  const handleAddNeedle = () => {
    const currentNeedles = watch('needles') || [];
    if (currentNeedles.length < 10) { // Limit to 10 needles
      const newNeedles = [...currentNeedles, { serial_number: '' }];
      setValue('needles', newNeedles);
      setSelectedNeedleTypes(newNeedles);
    }
  };
  
  // Handler for removing a needle
  const handleRemoveNeedle = (index) => {
    const currentNeedles = watch('needles') || [];
    if (currentNeedles.length > 1) {
      const newNeedles = currentNeedles.filter((_, i) => i !== index);
      setValue('needles', newNeedles);
      setSelectedNeedleTypes(newNeedles);
    }
  };
  
  // Generate certificate number based on current date and random number
  useEffect(() => {
    if (!watch('certificateNumber')) {
      // Format: AG-{YYYYMMDD}-{random 4 digits}
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      
      const certificateNumber = `AG-${year}${month}${day}-${random}`;
      setValue('certificateNumber', certificateNumber);
    }
  }, [setValue, watch]);
  
  // Obtener todas las agujas seleccionadas actualmente
  const getSelectedNeedleIds = () => {
    const needlesArray = watch('needles') || [];
    // Crear un array con los IDs de agujas ya seleccionadas (excepto cadenas vacías o undefined)
    return needlesArray
      .map(n => n.serial_number)
      .filter(id => id !== undefined && id !== '');
  };
  
  // Verificar si una aguja ya está seleccionada en otro campo distinto al actual
  const isNeedleSelectedElsewhere = (needleId, currentFieldIndex) => {
    const needles = watch('needles') || [];
    return needles.some((needle, index) => 
      index !== currentFieldIndex && 
      needle.serial_number && 
      String(needle.serial_number) === String(needleId)
    );
  };
  
  // Show a loading state while fetching data
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Cargando datos para la certificación...</Typography>
      </Box>
    );
  }

  // Show an error state if there was an error fetching data
  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </Box>
    );
  }

  // Si no hay inspectores o clientes disponibles
  if (inspectors.length === 0 || customers.length === 0) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {inspectors.length === 0 
            ? 'No hay inspectores disponibles en el sistema. Contacte al administrador.' 
            : 'No hay clientes disponibles para esta empresa. Contacte al administrador.'}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Detalles técnicos: 
          {inspectors.length === 0 && (
            <Box component="span" sx={{ display: 'block' }}>
              - No se encontraron inspectores en la base de datos.
            </Box>
          )}
          {customers.length === 0 && (
            <Box component="span" sx={{ display: 'block' }}>
              - No se encontraron clientes asociados al fabricante seleccionado.
              - Compruebe que la relación existe en la tabla relacion_fabricante_cliente.
            </Box>
          )}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Información de Certificación de Agujas
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {/* Needles Selection */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">
              Selección de Agujas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(watch('needles') || []).length} de 10 agujas máximo
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            border: '1px solid #e0e0e0', 
            borderRadius: 2,
            backgroundColor: '#fafafa',
            mb: 2
          }}>
            {(watch('needles') || []).map((needle, index) => (
              <Box 
                key={index} 
                sx={{ 
                  mb: index < (watch('needles') || []).length - 1 ? 2 : 0,
                  p: 2, 
                  backgroundColor: 'white',
                  border: '1px solid #eaeaea', 
                  borderRadius: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={10} sm={10}>
                    <Controller
                      name={`needles[${index}].serial_number`}
                      control={control}
                      rules={{ required: 'Se requiere seleccionar una aguja' }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.needles?.[index]?.serial_number}>
                          <InputLabel id={`aguja-label-${index}`}>Número de Aguja</InputLabel>
                          <Select
                            {...field}
                            labelId={`aguja-label-${index}`}
                            label="Número de Aguja"
                          >
                            <MenuItem value="">Seleccione una aguja</MenuItem>
                            {/* Filtramos el inventario para mostrar solo las agujas del fabricante actual
                                y que no estén ya seleccionadas en otro campo */}
                            {(Array.isArray(needleInventory) ? needleInventory : [])
                              .filter(needle => {
                                // No filtramos si no hay usuario o fabricante_id
                                if (!currentUser || !currentUser.fabricante_id) {
                                  return true;
                                }
                                // Convertir ambos a números para comparar correctamente
                                const needleCompanyId = Number(needle.company_id);
                                const userCompanyId = Number(currentUser.fabricante_id);
                                return needleCompanyId === userCompanyId;
                              })
                              .filter(needle => {
                                // No mostrar las agujas que ya están seleccionadas en otros campos
                                return !isNeedleSelectedElsewhere(needle.id, index);
                              })
                              .map(needle => (
                                <MenuItem key={needle.id} value={needle.id}>
                                  <Box>
                                    <Typography variant="body1">{needle.num}</Typography>
                                  </Box>
                                </MenuItem>
                              ))
                            }
                          </Select>
                          {errors.needles?.[index]?.serial_number && (
                            <FormHelperText>{errors.needles?.[index]?.serial_number.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={2} sm={2}>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveNeedle(index)}
                      disabled={(watch('needles') || []).length <= 1}
                      title="Eliminar aguja"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddNeedle}
            sx={{ mt: 1 }}
            disabled={(watch('needles') || []).length >= 10}
            color="primary"
            fullWidth
          >
            Agregar Aguja ({(watch('needles') || []).length}/10)
          </Button>
        </Grid>
        
        {/* Comments - Solo mostrar si hideComments es false */}
        {!hideComments && (
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Comentarios"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Añada cualquier observación relevante sobre estas agujas"
                />
              )}
            />
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default NeedlesForm;