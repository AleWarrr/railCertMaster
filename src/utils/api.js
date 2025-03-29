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
  try {
    // Para desarrollo: simulación de login con usuarios predefinidos
    const mockUsers = {
      admin: {
        id: 'admin',
        username: 'admin',
        name: 'Administrador',
        email: 'admin@railcertmaster.com',
        role: 'admin',
        company: {
          companyName: 'RailCert SL',
          contactName: 'Juan Pérez',
          email: 'contacto@railcert.com',
          phone: '912345678',
          address: 'Calle Ferroviaria, 1',
          city: 'Madrid',
          state: 'Madrid',
          zipCode: '28001',
          country: 'España',
          registrationNumber: 'REG987654',
          taxId: 'B87654321'
        }
      },
      demo: {
        id: 'demo',
        username: 'demo',
        name: 'Usuario Demo',
        email: 'demo@ejemplo.com',
        role: 'user',
        company: {
          companyName: 'Empresa Demo',
          contactName: 'Contacto Demo',
          email: 'contacto@empresademo.com',
          phone: '123456789',
          address: 'Calle Demo, 123',
          city: 'Ciudad Demo',
          state: 'Provincia Demo',
          zipCode: '12345',
          country: 'España',
          registrationNumber: 'REG12345',
          taxId: 'B12345678'
        }
      }
    };
    
    // Verificar si debemos usar usuarios de prueba o intentar el backend real
    if (mockUsers[username] && password === username) {
      // En desarrollo: devolver usuario de prueba con su token
      const userData = mockUsers[username];
      const token = `${username}-token`;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('companyProfile', JSON.stringify(userData.company));
      
      return { 
        success: true, 
        token: token, 
        user: userData 
      };
    }
    
    // Intentar con el backend real - Este código eventualmente reemplazará la simulación
    try {
      // Crear una URL específica para verificar si el endpoint existe
      const apiUrl = `${API_BASE_URL}/auth/login`;
      
      // Hacer un preflight para verificar si el endpoint existe
      const preflight = await fetch(apiUrl, { method: 'OPTIONS' });
      
      if (preflight.ok) {
        // Si el endpoint existe, usar fetchApi normalmente
        const response = await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: username, password })
        });
        
        // Si el login fue exitoso, guardar el token
        if (response.success && response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userData', JSON.stringify(response.user));
          if (response.user && response.user.company) {
            localStorage.setItem('companyProfile', JSON.stringify(response.user.company));
          }
        }
        
        return response;
      }
    } catch (apiError) {
      // Si hay error con el endpoint real, continuamos con el flujo normal
      console.log('API endpoint de login no disponible:', apiError);
    }
    
    // Si llegamos aquí, el usuario no coincide con los de prueba
    // y/o el backend no está disponible
    return { 
      success: false, 
      error: 'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales.' 
    };
  } catch (error) {
    console.error('Error en login:', error);
    return { 
      success: false, 
      error: 'Error al conectar con el servidor. Por favor, inténtalo más tarde.' 
    };
  }
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
  if (!userData) return null;

  try {
    const user = JSON.parse(userData);
    
    // Para usuarios de prueba, asignar un fabricante_id si no existe
    if (user && !user.fabricante_id && user.company) {
      // Asignar el ID 1 por defecto para la empresa "Talleres Alegría"
      user.fabricante_id = 1;
      console.log('Se ha asignado fabricante_id=1 al usuario actual:', user);
      
      // Actualizar los datos en localStorage
      localStorage.setItem('userData', JSON.stringify(user));
    }
    
    return user;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
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
  try {
    // Intentar obtener los inspectores del servidor
    const result = await fetchApi('/inspectors');
    
    // Si el resultado es un array válido y no está vacío, devolverlo
    if (Array.isArray(result) && result.length > 0) {
      console.log(`Se encontraron ${result.length} inspectores`);
      return result;
    }
    
    // En modo desarrollo, devolver datos simulados
    console.log('Usando datos simulados para inspectores en modo desarrollo');
    return [
      {
        id: 1,
        nombre: "Juan Pérez",
        codigo_inspector: "INS-001",
        email: "juan.perez@empresa.com",
        telefono: "912345678",
        activo: true
      },
      {
        id: 2,
        nombre: "María López",
        codigo_inspector: "INS-002",
        email: "maria.lopez@empresa.com",
        telefono: "912345679",
        activo: true
      },
      {
        id: 3,
        nombre: "Antonio García",
        codigo_inspector: "INS-003",
        email: "antonio.garcia@empresa.com",
        telefono: "912345680",
        activo: true
      }
    ];
  } catch (error) {
    console.error('Error obteniendo inspectores:', error);
    
    // En caso de error, devolver datos simulados
    console.log('Error al obtener inspectores, usando datos simulados');
    return [
      {
        id: 1,
        nombre: "Juan Pérez",
        codigo_inspector: "INS-001",
        email: "juan.perez@empresa.com",
        telefono: "912345678",
        activo: true
      },
      {
        id: 2,
        nombre: "María López",
        codigo_inspector: "INS-002",
        email: "maria.lopez@empresa.com",
        telefono: "912345679",
        activo: true
      }
    ];
  }
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
  try {
    const result = await fetchApi('/needle-types');
    if (Array.isArray(result)) {
      return result;
    }
    console.error('getNeedleTypes: No es un array:', result);
    return [];
  } catch (error) {
    console.error('Error en getNeedleTypes:', error);
    return [];
  }
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
  try {
    const result = await fetchApi('/needle-inventory');
    // Asegurarnos de que siempre devolvemos un array
    return Array.isArray(result) ? result : (result && Array.isArray(result.data) ? result.data : []);
  } catch (error) {
    console.error('Error en getNeedleInventory:', error);
    return [];
  }
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
 * Get available needles by company ID
 * @param {number} companyId - Company ID
 * @returns {Promise<Array>} - List of needles associated with the company
 */
export const getNeedleInventoryByCompanyId = async (companyId) => {
  try {
    if (!companyId) return [];
    
    const result = await fetchApi(`/needle-inventory/company/${companyId}`);
    return Array.isArray(result) ? result : (result && Array.isArray(result.data) ? result.data : []);
  } catch (error) {
    console.error('Error en getNeedleInventoryByCompanyId:', error);
    return [];
  }
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

/**
 * Get authentication headers for API requests
 * @returns {Object} - Headers object with authorization token if available
 */
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Incluir token de autenticación si existe
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

/**
 * Get customers by company ID (fabricante)
 * @param {number} companyId - Company ID (fabricante)
 * @returns {Promise<Array>} - List of customers related to this company
 */
export const getCustomersByCompanyId = async (companyId) => {
  if (!companyId) return [];
  
  console.log(`Obteniendo clientes para la empresa ID: ${companyId}`);
  
  try {
    // Intentar obtener los clientes del servidor
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/customers`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    // Si la respuesta es exitosa, devolver los datos
    if (response.ok) {
      const data = await response.json();
      console.log(`Se encontraron ${data.length} clientes para la empresa ID: ${companyId}`);
      return data;
    }
    
    // Si estamos en modo de desarrollo, devolver datos simulados
    console.log('Usando datos simulados para clientes en modo desarrollo');
    return [
      {
        id: 1,
        nombre: "ADIF",
        nif: "Q2801660H",
        ubicacion: "Madrid, España",
        email: "contacto@adif.es",
        telefono: "912345678",
        customer_number: "CUST-001",
        fabricante_id: 1
      },
      {
        id: 2,
        nombre: "Renfe",
        nif: "Q2801659J", 
        ubicacion: "Madrid, España",
        email: "contacto@renfe.es",
        telefono: "913456789",
        customer_number: "CUST-002",
        fabricante_id: 1
      },
      {
        id: 3,
        nombre: "FGC",
        nif: "A08000143",
        ubicacion: "Barcelona, España",
        email: "contacto@fgc.cat",
        telefono: "934567890",
        customer_number: "CUST-003",
        fabricante_id: 1
      }
    ];
  } catch (error) {
    console.error('Error obteniendo clientes por ID de empresa:', error);
    
    // En caso de error, devolver un array vacío
    return [];
  }
};