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
export const fetchApi = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // Incluir token de autenticación si existe
        ...(localStorage.getItem('authToken') && {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Login to the application
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} - Login response with token and user data
 */
export const login = async (username, password) => {
  const response = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  // Si el login fue exitoso, guardar el token
  if (response.success && response.token) {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userData', JSON.stringify(response.user));
  }
  
  return response;
};

/**
 * Logout from the application
 * @returns {Promise<Object>} - Logout response
 */
export const logout = async () => {
  // Eliminar token y datos del usuario
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  return { success: true };
};

/**
 * Get current user data
 * @returns {Object|null} - User data or null if not logged in
 */
export const getCurrentUser = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
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
  return fetchApi('/certificates', {
    method: 'POST',
    body: JSON.stringify(certificateData)
  });
};

/**
 * Update an existing certificate
 * @param {string} id - Certificate ID
 * @param {Object} certificateData - Updated certificate data
 * @returns {Promise<Object>} - Success response
 */
export const updateCertificate = async (id, certificateData) => {
  return fetchApi(`/certificates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(certificateData)
  });
};

/**
 * Add an attachment to a certificate
 * @param {string} certificateId - Certificate ID
 * @param {Object} attachmentData - Attachment data (file_name, file_path)
 * @returns {Promise<Object>} - Success response
 */
export const addCertificateAttachment = async (certificateId, attachmentData) => {
  return fetchApi(`/certificates/${certificateId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(attachmentData)
  });
};

/**
 * Delete a certificate attachment
 * @param {number} attachmentId - Attachment ID
 * @returns {Promise<Object>} - Success response
 */
export const deleteCertificateAttachment = async (attachmentId) => {
  return fetchApi(`/attachments/${attachmentId}`, {
    method: 'DELETE'
  });
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
  return fetchApi('/needle-inventory', {
    method: 'POST',
    body: JSON.stringify(needleData)
  });
};

/**
 * Create a new customer
 * @param {Object} customerData - Customer data with name, location, nif, etc.
 * @returns {Promise<Object>} - Response with the new customer
 */
export const createCustomer = async (customerData) => {
  return fetchApi('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });
};

/**
 * Update an existing customer
 * @param {number} id - Customer ID
 * @param {Object} customerData - Updated customer data
 * @returns {Promise<Object>} - Response with the updated customer
 */
export const updateCustomer = async (id, customerData) => {
  return fetchApi(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData)
  });
};

/**
 * Delete a customer
 * @param {number} id - Customer ID
 * @returns {Promise<Object>} - Success response
 */
export const deleteCustomer = async (id) => {
  return fetchApi(`/customers/${id}`, {
    method: 'DELETE'
  });
};

/**
 * Create a new inspector
 * @param {Object} inspectorData - Inspector data with name, code, email
 * @returns {Promise<Object>} - Response with the new inspector
 */
export const createInspector = async (inspectorData) => {
  return fetchApi('/inspectors', {
    method: 'POST',
    body: JSON.stringify(inspectorData)
  });
};

/**
 * Update an existing inspector
 * @param {number} id - Inspector ID
 * @param {Object} inspectorData - Updated inspector data
 * @returns {Promise<Object>} - Response with the updated inspector
 */
export const updateInspector = async (id, inspectorData) => {
  return fetchApi(`/inspectors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(inspectorData)
  });
};

/**
 * Delete an inspector
 * @param {number} id - Inspector ID
 * @returns {Promise<Object>} - Success response
 */
export const deleteInspector = async (id) => {
  return fetchApi(`/inspectors/${id}`, {
    method: 'DELETE'
  });
};