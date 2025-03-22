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
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Controller } from 'react-hook-form';

/**
 * NeedlesForm - Specialized component for handling needle material certifications
 * Manages needle-specific form fields, including needle weld types and customer information
 */
const NeedlesForm = ({ control, errors, watch, setValue, getMaterialTemplate }) => {
  const [customers, setCustomers] = useState([
    { id: '1', name: 'Railway Company A', address: '123 Railway St, City A' },
    { id: '2', name: 'Railway Company B', address: '456 Track Boulevard, City B' },
    { id: '3', name: 'Railway Company C', address: '789 Locomotive Lane, City C' },
  ]);
  
  const [inspectors, setInspectors] = useState([
    { id: '1', name: 'John Smith', qualification: 'Lead Inspector' },
    { id: '2', name: 'Sarah Johnson', qualification: 'Senior Inspector' },
    { id: '3', name: 'Michael Brown', qualification: 'Quality Control Specialist' },
  ]);
  
  const [needleWeldTypes, setNeedleWeldTypes] = useState([
    { id: '1', name: 'Type A - Standard Weld', specification: 'RS-2023-A' },
    { id: '2', name: 'Type B - Heavy Duty Weld', specification: 'RS-2023-B' },
    { id: '3', name: 'Type C - Precision Weld', specification: 'RS-2023-C' },
    { id: '4', name: 'Type D - High Tensile Weld', specification: 'RS-2023-D' },
    { id: '5', name: 'Type E - Special Purpose Weld', specification: 'RS-2023-E' },
  ]);
  
  const [selectedNeedleWelds, setSelectedNeedleWelds] = useState([]);
  
  // Initialize needle welds from form data if available
  useEffect(() => {
    const template = getMaterialTemplate('needles');
    if (template && template.needleWelds) {
      // Initialize with default needle welds if not already set
      if (!watch('needleWelds') || watch('needleWelds').length === 0) {
        setValue('needleWelds', [{ weldTypeId: '', serialNumber: '', testResult: '' }]);
      }
      
      setSelectedNeedleWelds(watch('needleWelds') || []);
    }
  }, [getMaterialTemplate, setValue, watch]);
  
  // Handler for adding a new needle weld entry
  const handleAddNeedleWeld = () => {
    const currentWelds = watch('needleWelds') || [];
    if (currentWelds.length < 10) { // Limit to 10 welds as specified in requirements
      const newWelds = [...currentWelds, { weldTypeId: '', serialNumber: '', testResult: '' }];
      setValue('needleWelds', newWelds);
      setSelectedNeedleWelds(newWelds);
    }
  };
  
  // Handler for removing a needle weld entry
  const handleRemoveNeedleWeld = (index) => {
    const currentWelds = watch('needleWelds') || [];
    if (currentWelds.length > 1) {
      const newWelds = currentWelds.filter((_, i) => i !== index);
      setValue('needleWelds', newWelds);
      setSelectedNeedleWelds(newWelds);
    }
  };
  
  // Handler for updating a needle weld entry
  const handleWeldTypeChange = (index, value) => {
    const currentWelds = [...(watch('needleWelds') || [])];
    currentWelds[index] = { ...currentWelds[index], weldTypeId: value };
    setValue('needleWelds', currentWelds);
    setSelectedNeedleWelds(currentWelds);
  };
  
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
              rules={{ required: 'Certificate number is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Certificate Number"
                  fullWidth
                  variant="outlined"
                  error={!!errors.certificateNumber}
                  helperText={errors.certificateNumber?.message}
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
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="materialType"
              control={control}
              rules={{ required: 'Material type is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Material Type"
                  fullWidth
                  variant="outlined"
                  disabled
                  value="Needles"
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="batchNumber"
              control={control}
              rules={{ required: 'Batch number is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Batch Number"
                  fullWidth
                  variant="outlined"
                  error={!!errors.batchNumber}
                  helperText={errors.batchNumber?.message}
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
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    {...field}
                    labelId="status-label"
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="final">Final</MenuItem>
                  </Select>
                </FormControl>
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
              name="customerName"
              control={control}
              rules={{ required: 'Customer is required' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.customerName}>
                  <InputLabel id="customer-label">Customer</InputLabel>
                  <Select
                    {...field}
                    labelId="customer-label"
                    label="Customer"
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.name}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.customerName && (
                    <FormHelperText>{errors.customerName.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="customerReference"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Customer Reference Number"
                  fullWidth
                  variant="outlined"
                />
              )}
            />
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
              name="storeAddress"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Store Address"
                  fullWidth
                  variant="outlined"
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="inspectorName"
              control={control}
              rules={{ required: 'Inspector is required' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.inspectorName}>
                  <InputLabel id="inspector-label">Inspector</InputLabel>
                  <Select
                    {...field}
                    labelId="inspector-label"
                    label="Inspector"
                  >
                    {inspectors.map((inspector) => (
                      <MenuItem key={inspector.id} value={inspector.name}>
                        {inspector.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.inspectorName && (
                    <FormHelperText>{errors.inspectorName.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Needle Weld Specifications
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {watch('needleWelds') && watch('needleWelds').length > 0 ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={5}><Typography variant="subtitle2">Weld Type</Typography></Grid>
                      <Grid item xs={3}><Typography variant="subtitle2">Serial Number</Typography></Grid>
                      <Grid item xs={3}><Typography variant="subtitle2">Test Result</Typography></Grid>
                      <Grid item xs={1}></Grid>
                    </Grid>
                  </Box>
                  
                  {watch('needleWelds').map((weld, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={5}>
                          <Controller
                            name={`needleWelds.${index}.weldTypeId`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel id={`weld-type-label-${index}`}>Weld Type</InputLabel>
                                <Select
                                  {...field}
                                  labelId={`weld-type-label-${index}`}
                                  label="Weld Type"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleWeldTypeChange(index, e.target.value);
                                  }}
                                >
                                  {needleWeldTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                      {type.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Controller
                            name={`needleWelds.${index}.serialNumber`}
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
                        <Grid item xs={3}>
                          <Controller
                            name={`needleWelds.${index}.testResult`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Test Result"
                                fullWidth
                                variant="outlined"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={1}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveNeedleWeld(index)}
                            disabled={watch('needleWelds').length <= 1}
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
                    onClick={handleAddNeedleWeld}
                    disabled={watch('needleWelds').length >= 10}
                    sx={{ mt: 1 }}
                  >
                    Add Needle Weld
                  </Button>
                  {watch('needleWelds').length >= 10 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Maximum of 10 needle welds allowed.
                    </Alert>
                  )}
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={handleAddNeedleWeld}
                >
                  Add Needle Weld
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="contained"
          endIcon={<NextIcon />}
          onClick={() => {}} // Just a placeholder - navigation handled by parent
        >
          Next
        </Button>
      </Box>
    </Card>
  );
};

export default NeedlesForm;