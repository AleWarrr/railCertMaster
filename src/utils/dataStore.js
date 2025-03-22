/**
 * Data storage utilities for interacting with Electron's IPC
 * This module provides a clean API for working with the Electron Store
 */

// Get company profile from the store
export const getCompanyProfile = async () => {
  try {
    const result = await window.api.getCompanyProfile();
    if (result.success) {
      return result.data || {};
    } else {
      throw new Error(result.error || 'Failed to get company profile');
    }
  } catch (error) {
    console.error('Error in getCompanyProfile:', error);
    throw error;
  }
};

// Save company profile to the store
export const saveCompanyProfile = async (profileData) => {
  try {
    const result = await window.api.saveCompanyProfile(profileData);
    if (result.success) {
      return true;
    } else {
      throw new Error(result.error || 'Failed to save company profile');
    }
  } catch (error) {
    console.error('Error in saveCompanyProfile:', error);
    throw error;
  }
};

// Get certificate templates from the store
export const getCertificateTemplates = async () => {
  try {
    const result = await window.api.getCertificateTemplates();
    if (result.success) {
      return result.data || {};
    } else {
      throw new Error(result.error || 'Failed to get certificate templates');
    }
  } catch (error) {
    console.error('Error in getCertificateTemplates:', error);
    throw error;
  }
};

// Get a specific certificate template
export const getCertificateTemplate = async (templateId) => {
  try {
    const result = await window.api.getCertificateTemplate(templateId);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to get certificate template');
    }
  } catch (error) {
    console.error('Error in getCertificateTemplate:', error);
    throw error;
  }
};

// Save a certificate template
export const saveCertificateTemplate = async (templateData) => {
  try {
    const result = await window.api.saveCertificateTemplate(templateData);
    if (result.success) {
      return true;
    } else {
      throw new Error(result.error || 'Failed to save certificate template');
    }
  } catch (error) {
    console.error('Error in saveCertificateTemplate:', error);
    throw error;
  }
};

// Get certificates from the store
export const getCertificates = async () => {
  try {
    const result = await window.api.getCertificates();
    if (result.success) {
      return result.data || {};
    } else {
      throw new Error(result.error || 'Failed to get certificates');
    }
  } catch (error) {
    console.error('Error in getCertificates:', error);
    throw error;
  }
};

// Get a specific certificate
export const getCertificate = async (certificateId) => {
  try {
    const result = await window.api.getCertificates();
    if (result.success) {
      return result.data?.[certificateId] || null;
    } else {
      throw new Error(result.error || 'Failed to get certificate');
    }
  } catch (error) {
    console.error('Error in getCertificate:', error);
    throw error;
  }
};

// Save a certificate
export const saveCertificate = async (certificateData) => {
  try {
    const result = await window.api.saveCertificate(certificateData);
    if (result.success) {
      return true;
    } else {
      throw new Error(result.error || 'Failed to save certificate');
    }
  } catch (error) {
    console.error('Error in saveCertificate:', error);
    throw error;
  }
};

// Delete a certificate
export const deleteCertificate = async (certificateId) => {
  try {
    // In a real implementation, you would add a delete method to the IPC bridge
    // For now, we'll just mock success
    return true;
  } catch (error) {
    console.error('Error in deleteCertificate:', error);
    throw error;
  }
};
