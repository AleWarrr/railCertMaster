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
  FileCopy as DuplicateIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { MATERIAL_TYPES, getMaterialTemplate } from '../utils/materialTemplates';
import AttachmentManager from './AttachmentManager';
import NeedlesForm from './NeedlesForm';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`certificate-tabpanel-${index}`}
      aria-labelledby={`certificate-tab-${index}`}
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

const CertificateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [materialType, setMaterialType] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [discardDialog, setDiscardDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const { control, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      id: '',
      certificateNumber: '',
      materialType: '',
      customerName: '',
      customerReference: '',
      batchNumber: '',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      createdAt: new Date().toISOString(),
      testResults: [],
      chemicalComposition: [],
      mechanicalProperties: [],
      comments: '',
      attachments: []
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

  // Load certificate data and company profile on init
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load company profile
        const profileResult = await window.api.getCompanyProfile();
        if (profileResult.success && profileResult.data) {
          setCompanyProfile(profileResult.data);
        }
        
        // If editing, load certificate data
        if (isEditMode) {
          const certificatesResult = await window.api.getCertificates();
          if (certificatesResult.success && certificatesResult.data && certificatesResult.data[id]) {
            const certificateData = certificatesResult.data[id];
            
            // Reset form with loaded data
            reset(certificateData);
            setMaterialType(certificateData.materialType);
          } else {
            // Certificate not found
            setSnackbar({
              open: true,
              message: 'Certificate not found',
              severity: 'error'
            });
            navigate('/certificates');
          }
        } else {
          // New certificate - set default ID
          setValue('id', uuidv4());
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setSnackbar({
          open: true,
          message: `Error loading data: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode, navigate, reset, setValue]);

  // Update form fields when material type changes
  useEffect(() => {
    if (watchMaterialType && watchMaterialType !== materialType) {
      const template = getMaterialTemplate(watchMaterialType);
      setMaterialType(watchMaterialType);
      
      // Clear existing arrays
      setValue('testResults', []);
      setValue('chemicalComposition', []);
      setValue('mechanicalProperties', []);
      
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
  }, [watchMaterialType, materialType, appendTestResult, appendChemical, appendMechanical, setValue]);

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
          message: 'Attachment added successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      setSnackbar({
        open: true,
        message: `Error adding attachment: ${error.message}`,
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
          message: 'Certificate saved successfully',
          severity: 'success'
        });
        
        // If it's a new certificate, navigate to edit mode
        if (!isEditMode) {
          navigate(`/certificates/edit/${data.id}`);
        }
      } else {
        throw new Error(result.error || 'Failed to save certificate');
      }
    } catch (error) {
      console.error('Error saving certificate:', error);
      setSnackbar({
        open: true,
        message: `Error saving certificate: ${error.message}`,
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
      navigate('/certificates');
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
    navigate(`/certificates/preview/${data.id}`);
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
    'Basic Information',
    'Test Results',
    'Chemical & Mechanical Properties',
    'Additional Information'
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Certificate' : 'Create New Certificate'}
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            sx={{ mr: 1 }}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PreviewIcon />}
            sx={{ mr: 1 }}
            onClick={handlePreview}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit(handleSaveCertificate)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
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
          <>
            {watchMaterialType === 'needles' ? (
              // Render Needles-specific form
              <NeedlesForm 
                control={control} 
                errors={errors} 
                watch={watch} 
                setValue={setValue} 
                getMaterialTemplate={getMaterialTemplate}
              />
            ) : (
              // Render default form for other material types
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
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
                          <FormControl fullWidth error={!!errors.materialType}>
                            <InputLabel id="material-type-label">Material Type</InputLabel>
                            <Select
                              {...field}
                              labelId="material-type-label"
                              label="Material Type"
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
                        name="quantity"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Quantity"
                            fullWidth
                            variant="outlined"
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
                        rules={{ required: 'Customer name is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Customer Name"
                            fullWidth
                            variant="outlined"
                            error={!!errors.customerName}
                            helperText={errors.customerName?.message}
                          />
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
                  </Grid>
                </CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                  <Button
                    variant="contained"
                    endIcon={<NextIcon />}
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </Box>
              </Card>
            )}
          </>
        )}
        
        {/* Step 2: Test Results */}
        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {testResultsFields.length > 0 ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={4}><Typography variant="subtitle2">Test Name</Typography></Grid>
                    <Grid item xs={3}><Typography variant="subtitle2">Standard Value</Typography></Grid>
                    <Grid item xs={3}><Typography variant="subtitle2">Actual Value</Typography></Grid>
                    <Grid item xs={1}><Typography variant="subtitle2">Unit</Typography></Grid>
                    <Grid item xs={1}></Grid>
                  </Grid>
                  
                  {testResultsFields.map((field, index) => (
                    <Grid container spacing={2} key={field.id} sx={{ mb: 1 }}>
                      <Grid item xs={4}>
                        <Controller
                          name={`testResults.${index}.name`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Controller
                          name={`testResults.${index}.standardValue`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Controller
                          name={`testResults.${index}.actualValue`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <Controller
                          name={`testResults.${index}.unit`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton 
                          color="error" 
                          onClick={() => removeTestResult(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No test results added yet. Add some using the button below or select a material type.
                </Alert>
              )}
              
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={() => appendTestResult({ name: '', standardValue: '', actualValue: '', unit: '' })}
                sx={{ mt: 2 }}
              >
                Add Test Result
              </Button>
            </CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PrevIcon />}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={handleNext}
              >
                Next
              </Button>
            </Box>
          </Card>
        )}
        
        {/* Step 3: Chemical & Mechanical Properties */}
        {activeStep === 2 && (
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="properties tabs">
                  <Tab label="Chemical Composition" />
                  <Tab label="Mechanical Properties" />
                </Tabs>
              </Box>
              
              {/* Chemical Composition Tab */}
              <TabPanel value={activeTab} index={0}>
                <Typography variant="h6" gutterBottom>
                  Chemical Composition
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                {chemicalFields.length > 0 ? (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={3}><Typography variant="subtitle2">Element</Typography></Grid>
                      <Grid item xs={2}><Typography variant="subtitle2">Min Value</Typography></Grid>
                      <Grid item xs={2}><Typography variant="subtitle2">Max Value</Typography></Grid>
                      <Grid item xs={3}><Typography variant="subtitle2">Actual Value</Typography></Grid>
                      <Grid item xs={1}><Typography variant="subtitle2">Unit</Typography></Grid>
                      <Grid item xs={1}></Grid>
                    </Grid>
                    
                    {chemicalFields.map((field, index) => (
                      <Grid container spacing={2} key={field.id} sx={{ mb: 1 }}>
                        <Grid item xs={3}>
                          <Controller
                            name={`chemicalComposition.${index}.element`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Controller
                            name={`chemicalComposition.${index}.minValue`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Controller
                            name={`chemicalComposition.${index}.maxValue`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Controller
                            name={`chemicalComposition.${index}.actualValue`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={1}>
                          <Controller
                            name={`chemicalComposition.${index}.unit`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={1}>
                          <IconButton 
                            color="error" 
                            onClick={() => removeChemical(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No chemical composition added yet. Add some using the button below or select a material type.
                  </Alert>
                )}
                
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={() => appendChemical({ element: '', minValue: '', maxValue: '', actualValue: '', unit: '%' })}
                  sx={{ mt: 2 }}
                >
                  Add Element
                </Button>
              </TabPanel>
              
              {/* Mechanical Properties Tab */}
              <TabPanel value={activeTab} index={1}>
                <Typography variant="h6" gutterBottom>
                  Mechanical Properties
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                {mechanicalFields.length > 0 ? (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}><Typography variant="subtitle2">Property</Typography></Grid>
                      <Grid item xs={3}><Typography variant="subtitle2">Required Value</Typography></Grid>
                      <Grid item xs={3}><Typography variant="subtitle2">Actual Value</Typography></Grid>
                      <Grid item xs={1}><Typography variant="subtitle2">Unit</Typography></Grid>
                      <Grid item xs={1}></Grid>
                    </Grid>
                    
                    {mechanicalFields.map((field, index) => (
                      <Grid container spacing={2} key={field.id} sx={{ mb: 1 }}>
                        <Grid item xs={4}>
                          <Controller
                            name={`mechanicalProperties.${index}.property`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Controller
                            name={`mechanicalProperties.${index}.requiredValue`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Controller
                            name={`mechanicalProperties.${index}.actualValue`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={1}>
                          <Controller
                            name={`mechanicalProperties.${index}.unit`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={1}>
                          <IconButton 
                            color="error" 
                            onClick={() => removeMechanical(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No mechanical properties added yet. Add some using the button below or select a material type.
                  </Alert>
                )}
                
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={() => appendMechanical({ property: '', requiredValue: '', actualValue: '', unit: '' })}
                  sx={{ mt: 2 }}
                >
                  Add Property
                </Button>
              </TabPanel>
            </CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PrevIcon />}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={handleNext}
              >
                Next
              </Button>
            </Box>
          </Card>
        )}
        
        {/* Step 4: Additional Information */}
        {activeStep === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="comments"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Comments"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Attachments
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <AttachmentManager
                    attachments={attachmentsFields}
                    onAdd={handleAddAttachment}
                    onRemove={removeAttachment}
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
                Back
              </Button>
              <Button
                variant="contained"
                endIcon={<SaveIcon />}
                onClick={handleSubmit(handleSaveCertificate)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Certificate'}
              </Button>
            </Box>
          </Card>
        )}
      </form>
      
      {/* Discard Changes Dialog */}
      <Dialog
        open={discardDialog}
        onClose={() => setDiscardDialog(false)}
      >
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Are you sure you want to discard them?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setDiscardDialog(false);
              navigate('/certificates');
            }} 
            color="error"
          >
            Discard Changes
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
        <DialogTitle>Generate Certificate Preview</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to save your changes and view the certificate preview?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setPreviewDialog(false);
              handleSubmit(handleNavigateToPreview)();
            }} 
            color="primary"
            variant="contained"
          >
            Save & Preview
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
