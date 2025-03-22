/**
 * API utility for handling server communication
 * Manages all API calls to the backend server
 */

// Use absolute URL to connect to the API server
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generic function to make API requests
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} body - Request body for POST/PUT requests
 * @returns {Promise<Object>} - Promise with API response
 */
const fetchApi = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in API call to ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Get all companies from the database
 * @returns {Promise<Array>} - List of companies
 */
export const getCompanies = async () => {
  return fetchApi('/companies');
};

/**
 * Get a specific company by ID
 * @param {number} id - Company ID
 * @returns {Promise<Object>} - Company data
 */
export const getCompany = async (id) => {
  return fetchApi(`/companies/${id}`);
};

/**
 * Get all customers from the database
 * @returns {Promise<Array>} - List of customers
 */
export const getCustomers = async () => {
  return fetchApi('/customers');
};

/**
 * Get a specific customer by ID
 * @param {number} id - Customer ID
 * @returns {Promise<Object>} - Customer data
 */
export const getCustomer = async (id) => {
  return fetchApi(`/customers/${id}`);
};

/**
 * Get all inspectors from the database
 * @returns {Promise<Array>} - List of inspectors
 */
export const getInspectors = async () => {
  return fetchApi('/inspectors');
};

/**
 * Get a specific inspector by ID
 * @param {number} id - Inspector ID
 * @returns {Promise<Object>} - Inspector data
 */
export const getInspector = async (id) => {
  return fetchApi(`/inspectors/${id}`);
};

/**
 * Get all needle types from the database
 * @returns {Promise<Array>} - List of needle types
 */
export const getNeedleTypes = async () => {
  return fetchApi('/needle-types');
};

/**
 * Get all certificates
 * @returns {Promise<Array>} - List of certificates
 */
export const getCertificates = async () => {
  return fetchApi('/certificates');
};

/**
 * Get a specific certificate by ID
 * @param {string} id - Certificate ID
 * @returns {Promise<Object>} - Certificate data with related needles and attachments
 */
export const getCertificate = async (id) => {
  return fetchApi(`/certificates/${id}`);
};

/**
 * Create a new certificate
 * @param {Object} certificateData - Certificate data
 * @returns {Promise<Object>} - Response with new certificate ID and number
 */
export const createCertificate = async (certificateData) => {
  return fetchApi('/certificates', 'POST', certificateData);
};

/**
 * Update an existing certificate
 * @param {string} id - Certificate ID
 * @param {Object} certificateData - Updated certificate data
 * @returns {Promise<Object>} - Success response
 */
export const updateCertificate = async (id, certificateData) => {
  return fetchApi(`/certificates/${id}`, 'PUT', certificateData);
};

/**
 * Add an attachment to a certificate
 * @param {string} certificateId - Certificate ID
 * @param {Object} attachmentData - Attachment data (file_name, file_path)
 * @returns {Promise<Object>} - Success response
 */
export const addCertificateAttachment = async (certificateId, attachmentData) => {
  return fetchApi(`/certificates/${certificateId}/attachments`, 'POST', attachmentData);
};

/**
 * Delete a certificate attachment
 * @param {number} attachmentId - Attachment ID
 * @returns {Promise<Object>} - Success response
 */
export const deleteCertificateAttachment = async (attachmentId) => {
  return fetchApi(`/attachments/${attachmentId}`, 'DELETE');
};

/**
 * Get all available needles in inventory
 * @returns {Promise<Array>} - List of needles
 */
export const getNeedleInventory = async () => {
  return fetchApi('/needle-inventory');
};

/**
 * Get available needles by type
 * @param {number} typeId - Needle type ID
 * @returns {Promise<Array>} - List of needles of the specific type
 */
export const getNeedleInventoryByType = async (typeId) => {
  return fetchApi(`/needle-inventory/type/${typeId}`);
};

/**
 * Search needles by number
 * @param {string} numQuery - Needle number search query
 * @returns {Promise<Array>} - List of matching needles
 */
export const searchNeedlesByNum = async (numQuery) => {
  return fetchApi(`/needle-inventory/search/${numQuery}`);
};

/**
 * Add a new needle to inventory
 * @param {Object} needleData - Needle data (needle_type_id, serial_number, num)
 * @returns {Promise<Object>} - Response with new needle data
 */
export const addNeedleToInventory = async (needleData) => {
  return fetchApi('/needle-inventory', 'POST', needleData);
};