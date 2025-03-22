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
          Needle Certification Information
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
                  label="Certificate Number (Auto-generated)"
                  fullWidth
                  variant="outlined"
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="companyId"
              control={control}
              rules={{ required: 'Company is required' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.companyId}>
                  <InputLabel id="company-label">Company</InputLabel>
                  <Select
                    {...field}
                    labelId="company-label"
                    label="Company"
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.companyId && (
                    <FormHelperText>{errors.companyId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="emittedIn"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Emitted In"
                  fullWidth
                  variant="outlined"
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Certificate Date"
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
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="customerId"
              control={control}
              rules={{ required: 'Customer is required' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.customerId}>
                  <InputLabel id="customer-label">Customer</InputLabel>
                  <Select
                    {...field}
                    labelId="customer-label"
                    label="Customer"
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.customerId && (
                    <FormHelperText>{errors.customerId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="customerNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Customer Number"
                  fullWidth
                  variant="outlined"
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="referenceNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reference Number"
                  fullWidth
                  variant="outlined"
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="dateOfSale"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Date of Sale"
                  type="date"
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="seller"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Seller"
                  fullWidth
                  variant="outlined"
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="orderNumber"
              control={control}
              rules={{ required: 'Order number is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Order Number"
                  fullWidth
                  variant="outlined"
                  error={!!errors.orderNumber}
                  helperText={errors.orderNumber?.message}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="qualityResponsible"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Quality Responsible"
                  fullWidth
                  variant="outlined"
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="qualityResponsibleEmail"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Quality Responsible Email"
                  fullWidth
                  variant="outlined"
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Needle Specifications
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {watch('needles') && watch('needles').length > 0 ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={8}><Typography variant="subtitle2">Needle Type</Typography></Grid>
                      <Grid item xs={3}><Typography variant="subtitle2">Serial Number</Typography></Grid>
                      <Grid item xs={1}></Grid>
                    </Grid>
                  </Box>
                  
                  {watch('needles').map((needle, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={8}>
                          <Controller
                            name={`needles.${index}.needle_type_id`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel id={`needle-type-label-${index}`}>Needle Type</InputLabel>
                                <Select
                                  {...field}
                                  labelId={`needle-type-label-${index}`}
                                  label="Needle Type"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleNeedleTypeChange(index, e.target.value);
                                  }}
                                >
                                  {needleTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                      {type.name} - {type.specification}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Controller
                            name={`needles.${index}.serial_number`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Serial Number"
                                fullWidth
                                variant="outlined"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={1}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveNeedle(index)}
                            disabled={watch('needles').length <= 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={handleAddNeedle}
                    disabled={watch('needles').length >= 10}
                    sx={{ mt: 1 }}
                  >
                    Add Needle Type
                  </Button>
                  {watch('needles').length >= 10 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Maximum of 10 needle types allowed.
                    </Alert>
                  )}
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={handleAddNeedle}
                >
                  Add Needle Type
                </Button>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Destination Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="destinationStore"
              control={control}
              rules={{ required: 'Destination store is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Destination Store"
                  fullWidth
                  variant="outlined"
                  error={!!errors.destinationStore}
                  helperText={errors.destinationStore?.message}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="destinationAddress"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Destination Address"
                  fullWidth
                  variant="outlined"
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Inspection Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="inspectorId"
              control={control}
              rules={{ required: 'Inspector is required' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.inspectorId}>
                  <InputLabel id="inspector-label">Inspector</InputLabel>
                  <Select
                    {...field}
                    labelId="inspector-label"
                    label="Inspector"
                  >
                    {inspectors.map((inspector) => (
                      <MenuItem key={inspector.id} value={inspector.id}>
                        {inspector.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.inspectorId && (
                    <FormHelperText>{errors.inspectorId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="inspectorCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Inspector Code"
                  fullWidth
                  variant="outlined"
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="inspectorEmail"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Inspector Email"
                  fullWidth
                  variant="outlined"
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    {...field}
                    labelId="status-label"
                    label="Status"
                    defaultValue="draft"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="final">Final</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="contained"
          endIcon={<NextIcon />}
          onClick={onNext}
        >
          Next: Attachments
        </Button>
      </Box>
    </Card>
  );
};

export default NeedlesForm;