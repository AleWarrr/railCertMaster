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
import { getCompanies, getCustomers, getInspectors, getNeedleTypes, getNeedleInventory, searchNeedlesByNum } from '../utils/api';

/**
 * NeedlesForm - Specialized component for handling needle material certifications
 * Manages needle-specific form fields, including needle weld types and customer information
 */
const NeedlesForm = ({ control, errors, watch, setValue, getMaterialTemplate, onNext }) => {
  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNeedleTypes, setSelectedNeedleTypes] = useState([]);
  const [needleTypes, setNeedleTypes] = useState([]);
  const [needleInventory, setNeedleInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Load data from the database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch companies, customers, inspectors, needle types, and inventory in parallel
        const [companiesRes, customersRes, inspectorsRes, needleTypesRes, needleInventoryRes] = await Promise.all([
          getCompanies(),
          getCustomers(),
          getInspectors(),
          getNeedleTypes(),
          getNeedleInventory()
        ]);
        
        setCompanies(companiesRes);
        setCustomers(customersRes);
        setInspectors(inspectorsRes);
        setNeedleTypes(needleTypesRes);
        setNeedleInventory(needleInventoryRes);
        
        // If we have companies, set a default
        if (companiesRes.length > 0) {
          setSelectedCompanyId(companiesRes[0].id);
          setValue('companyId', companiesRes[0].id);
          setValue('emittedIn', companiesRes[0].city);
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
      setValue('needles', [{ needle_type_id: '', serial_number: '' }]);
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
        setValue('inspectorCode', inspector.code);
        setValue('inspectorEmail', inspector.email);
      }
    }
  }, [watch('inspectorId'), inspectors, setValue]);
  
  // Handler when company changes
  useEffect(() => {
    const companyId = watch('companyId');
    if (companyId) {
      const company = companies.find(c => c.id === parseInt(companyId));
      if (company) {
        setValue('seller', company.name);
        setValue('qualityResponsible', company.quality_responsible);
        setValue('qualityResponsibleEmail', company.quality_responsible_email);
        setValue('emittedIn', company.city);
      }
    }
  }, [watch('companyId'), companies, setValue]);
  
  // Handler for adding a new needle
  const handleAddNeedle = () => {
    const currentNeedles = watch('needles') || [];
    if (currentNeedles.length < 10) { // Limit to 10 needles
      const newNeedles = [...currentNeedles, { needle_type_id: '', serial_number: '' }];
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
  
  // Handle searching for needles by number
  const handleNeedleSearch = async (index, query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await searchNeedlesByNum(query);
      console.log('Search results:', results);
      setSearchResults(results);
      
      // If there's an exact match, auto-select it
      if (results.length === 1 && results[0].num === query) {
        const needle = results[0];
        const currentNeedles = [...(watch('needles') || [])];
        currentNeedles[index] = { 
          ...currentNeedles[index], 
          needle_id: needle.id,
          serial_number: needle.num
        };
        setValue('needles', currentNeedles);
      }
    } catch (error) {
      console.error('Error searching for needles:', error);
    }
  };
  
  // Handler for updating a needle type and generate certificate number
  const handleNeedleTypeChange = (index, value) => {
    const currentNeedles = [...(watch('needles') || [])];
    currentNeedles[index] = { ...currentNeedles[index], needle_type_id: value };
    setValue('needles', currentNeedles);
    setSelectedNeedleTypes(currentNeedles);
    
    // Generate certificate number when a needle type is selected
    if (value) {
      const needleType = needleTypes.find(type => type.id === parseInt(value));
      if (needleType) {
        // Format: NT-{needle_type_id}-{YYYYMMDD}-{random 4 digits}
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        
        const certificateNumber = `NT-${value}-${year}${month}${day}-${random}`;
        setValue('certificateNumber', certificateNumber);
      }
    }
  };
  
  // Show a loading state while fetching data
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading certificate data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Show an error state if there was an error fetching data
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Información de Certificación de Agujas
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {/* Basic certificate information */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="certificateNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Número de Certificado"
                  fullWidth
                  required
                  error={!!errors.certificateNumber}
                  helperText={errors.certificateNumber?.message}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="issueDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha de Emisión"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.issueDate}
                  helperText={errors.issueDate?.message}
                />
              )}
            />
          </Grid>
          
          {/* Company Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.companyId}>
              <InputLabel id="company-label">Empresa Emisora</InputLabel>
              <Controller
                name="companyId"
                control={control}
                rules={{ required: 'Se requiere una empresa' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="company-label"
                    label="Empresa Emisora"
                    onChange={(e) => {
                      field.onChange(e);
                      const companyId = e.target.value;
                      const company = companies.find(c => c.id === parseInt(companyId));
                      if (company) {
                        setValue('seller', company.name);
                        setValue('qualityResponsible', company.quality_responsible);
                        setValue('qualityResponsibleEmail', company.quality_responsible_email);
                        setValue('emittedIn', company.city);
                      }
                    }}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.companyId && <FormHelperText>{errors.companyId.message}</FormHelperText>}
            </FormControl>
          </Grid>
          
          {/* Customer Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.customerId}>
              <InputLabel id="customer-label">Cliente</InputLabel>
              <Controller
                name="customerId"
                control={control}
                rules={{ required: 'Se requiere un cliente' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="customer-label"
                    label="Cliente"
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.customerId && <FormHelperText>{errors.customerId.message}</FormHelperText>}
            </FormControl>
          </Grid>
          
          {/* Inspector Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.inspectorId}>
              <InputLabel id="inspector-label">Inspector</InputLabel>
              <Controller
                name="inspectorId"
                control={control}
                rules={{ required: 'Se requiere un inspector' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="inspector-label"
                    label="Inspector"
                  >
                    {inspectors.map((inspector) => (
                      <MenuItem key={inspector.id} value={inspector.id}>
                        {inspector.name} ({inspector.code})
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.inspectorId && <FormHelperText>{errors.inspectorId.message}</FormHelperText>}
            </FormControl>
          </Grid>
          
          {/* Needles Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Selección de Agujas
            </Typography>
            
            {(watch('needles') || []).map((needle, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth error={!!errors.needles?.[index]?.needle_type_id}>
                      <InputLabel id={`needle-type-label-${index}`}>Tipo de Aguja</InputLabel>
                      <Controller
                        name={`needles[${index}].needle_type_id`}
                        control={control}
                        rules={{ required: 'Se requiere el tipo de aguja' }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            labelId={`needle-type-label-${index}`}
                            label="Tipo de Aguja"
                            onChange={(e) => {
                              handleNeedleTypeChange(index, e.target.value);
                            }}
                          >
                            {needleTypes.map((type) => (
                              <MenuItem key={type.id} value={type.id}>
                                {type.name} - {type.specification}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.needles?.[index]?.needle_type_id && (
                        <FormHelperText>{errors.needles[index].needle_type_id.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={5}>
                    <Controller
                      name={`needles[${index}].serial_number`}
                      control={control}
                      rules={{ required: 'Se requiere el número de serie' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Número de Serie"
                          fullWidth
                          error={!!errors.needles?.[index]?.serial_number}
                          helperText={errors.needles?.[index]?.serial_number?.message}
                          onChange={(e) => {
                            field.onChange(e);
                            handleNeedleSearch(index, e.target.value);
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={2} sm={2}>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveNeedle(index)}
                      disabled={(watch('needles') || []).length <= 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddNeedle}
              sx={{ mt: 1 }}
              disabled={(watch('needles') || []).length >= 10}
            >
              Añadir Aguja
            </Button>
          </Grid>
          
          {/* Comments */}
          <Grid item xs={12}>
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
                />
              )}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            endIcon={<NextIcon />}
            onClick={onNext}
          >
            Siguiente
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NeedlesForm;