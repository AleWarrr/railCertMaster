/**
 * API Adapter
 * 
 * This file provides a compatibility layer between the existing Electron IPC API
 * and our new server-based API, allowing us to transition smoothly without
 * breaking existing code.
 */

import * as api from './api';
import { v4 as uuidv4 } from 'uuid';

// Compatibility layer for window.api.* functions
const apiAdapter = {
  // Company profile
  getCompanyProfile: async () => {
    try {
      const companies = await api.getCompanies();
      if (companies && companies.length > 0) {
        return { 
          success: true, 
          data: companies[0] 
        };
      }
      return { success: false, error: 'No company found' };
    } catch (error) {
      console.error('Error in getCompanyProfile:', error);
      return { success: false, error: error.message };
    }
  },

  saveCompanyProfile: async (profileData) => {
    try {
      // Not implemented in this version
      return { success: true };
    } catch (error) {
      console.error('Error in saveCompanyProfile:', error);
      return { success: false, error: error.message };
    }
  },

  // Certificate templates
  getCertificateTemplates: async () => {
    try {
      return { success: true, data: {} };
    } catch (error) {
      console.error('Error in getCertificateTemplates:', error);
      return { success: false, error: error.message };
    }
  },

  getCertificateTemplate: async (templateId) => {
    try {
      return { success: true, data: null };
    } catch (error) {
      console.error('Error in getCertificateTemplate:', error);
      return { success: false, error: error.message };
    }
  },

  saveCertificateTemplate: async (templateData) => {
    try {
      return { success: true };
    } catch (error) {
      console.error('Error in saveCertificateTemplate:', error);
      return { success: false, error: error.message };
    }
  },

  // Certificates
  getCertificates: async () => {
    try {
      const certificates = await api.getCertificates();
      
      // Transform the array into an object with ID keys for compatibility
      const certificatesObj = {};
      certificates.forEach(cert => {
        certificatesObj[cert.id] = cert;
      });
      
      return { success: true, data: certificatesObj };
    } catch (error) {
      console.error('Error in getCertificates:', error);
      return { success: false, error: error.message };
    }
  },

  getCertificate: async (certificateId) => {
    try {
      const certificate = await api.getCertificate(certificateId);
      return { success: true, data: certificate };
    } catch (error) {
      console.error('Error in getCertificate:', error);
      return { success: false, error: error.message };
    }
  },

  saveCertificate: async (certificateData) => {
    try {
      // Check if it's a new certificate or update
      let result;
      
      if (!certificateData.id) {
        certificateData.id = uuidv4();
        result = await api.createCertificate(certificateData);
      } else {
        result = await api.updateCertificate(certificateData.id, certificateData);
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in saveCertificate:', error);
      return { success: false, error: error.message };
    }
  },

  deleteCertificate: async (certificateId) => {
    try {
      // Not implemented in this version
      return { success: true };
    } catch (error) {
      console.error('Error in deleteCertificate:', error);
      return { success: false, error: error.message };
    }
  },

  // File operations
  openFileDialog: async () => {
    try {
      // We'll just return a placeholder for now since we can't access the file system directly in the browser
      // In a real implementation, this would open a file input dialog
      
      // Create a file input and programmatically click it
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        
        // Set up file selection handler
        input.onchange = async (event) => {
          try {
            if (event.target.files && event.target.files.length > 0) {
              const file = event.target.files[0];
              
              // Convert to base64
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64String = e.target.result.split(',')[1]; // Remove the data URL part
                resolve({
                  success: true,
                  filePath: 'uploads/' + file.name, // Simulated path
                  fileName: file.name,
                  fileBuffer: base64String
                });
              };
              
              reader.onerror = () => {
                reject(new Error('Failed to read file'));
              };
              
              reader.readAsDataURL(file);
            } else {
              resolve({ success: false, canceled: true });
            }
          } catch (err) {
            reject(err);
          }
        };
        
        // Trigger the file input dialog
        input.click();
      });
    } catch (error) {
      console.error('Error in openFileDialog:', error);
      return { success: false, error: error.message };
    }
  },

  saveFileDialog: async ({ defaultPath, pdfData }) => {
    try {
      // In the browser, we'll create a temporary anchor for downloading
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultPath || 'certificate.pdf';
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Error in saveFileDialog:', error);
      return { success: false, error: error.message };
    }
  }
};

export default apiAdapter;