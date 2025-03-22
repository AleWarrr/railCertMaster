// Preload script for secure communication between renderer and main processes
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Company Profile operations
    saveCompanyProfile: (companyData) => {
      return ipcRenderer.invoke('save-company-profile', companyData);
    },
    getCompanyProfile: () => {
      return ipcRenderer.invoke('get-company-profile');
    },
    
    // Certificate Template operations
    saveCertificateTemplate: (templateData) => {
      return ipcRenderer.invoke('save-certificate-template', templateData);
    },
    getCertificateTemplates: () => {
      return ipcRenderer.invoke('get-certificate-templates');
    },
    getCertificateTemplate: (templateId) => {
      return ipcRenderer.invoke('get-certificate-template', templateId);
    },
    
    // Certificate operations
    saveCertificate: (certificateData) => {
      return ipcRenderer.invoke('save-certificate', certificateData);
    },
    getCertificates: () => {
      return ipcRenderer.invoke('get-certificates');
    },
    
    // File operations
    openFileDialog: () => {
      return ipcRenderer.invoke('open-file-dialog');
    },
    saveFileDialog: (options) => {
      return ipcRenderer.invoke('save-file-dialog', options);
    }
  }
);
