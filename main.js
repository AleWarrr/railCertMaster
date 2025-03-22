// Main Electron process file
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize the data store
const store = new Store();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public/icon.png')
  });

  // Load the index.html file
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, './build/index.html'));
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Create window when app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// IPC handlers for communication with renderer process

// Handle saving company profile data
ipcMain.handle('save-company-profile', async (event, companyData) => {
  try {
    store.set('companyProfile', companyData);
    return { success: true };
  } catch (error) {
    console.error('Error saving company profile:', error);
    return { success: false, error: error.message };
  }
});

// Handle getting company profile data
ipcMain.handle('get-company-profile', async () => {
  try {
    const profile = store.get('companyProfile', {});
    return { success: true, data: profile };
  } catch (error) {
    console.error('Error getting company profile:', error);
    return { success: false, error: error.message };
  }
});

// Handle saving certificate template data
ipcMain.handle('save-certificate-template', async (event, templateData) => {
  try {
    const templates = store.get('certificateTemplates', {});
    templates[templateData.id] = templateData;
    store.set('certificateTemplates', templates);
    return { success: true };
  } catch (error) {
    console.error('Error saving certificate template:', error);
    return { success: false, error: error.message };
  }
});

// Handle getting certificate templates
ipcMain.handle('get-certificate-templates', async () => {
  try {
    const templates = store.get('certificateTemplates', {});
    return { success: true, data: templates };
  } catch (error) {
    console.error('Error getting certificate templates:', error);
    return { success: false, error: error.message };
  }
});

// Handle getting specific certificate template
ipcMain.handle('get-certificate-template', async (event, templateId) => {
  try {
    const templates = store.get('certificateTemplates', {});
    return { success: true, data: templates[templateId] || null };
  } catch (error) {
    console.error('Error getting certificate template:', error);
    return { success: false, error: error.message };
  }
});

// Handle saving certificate data
ipcMain.handle('save-certificate', async (event, certificateData) => {
  try {
    const certificates = store.get('certificates', {});
    certificates[certificateData.id] = certificateData;
    store.set('certificates', certificates);
    return { success: true };
  } catch (error) {
    console.error('Error saving certificate:', error);
    return { success: false, error: error.message };
  }
});

// Handle getting certificates
ipcMain.handle('get-certificates', async () => {
  try {
    const certificates = store.get('certificates', {});
    return { success: true, data: certificates };
  } catch (error) {
    console.error('Error getting certificates:', error);
    return { success: false, error: error.message };
  }
});

// Handle file open dialog
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const filePath = result.filePaths[0];
      const fileBuffer = fs.readFileSync(filePath);
      return {
        success: true,
        filePath,
        fileName: path.basename(filePath),
        fileBuffer: fileBuffer.toString('base64')
      };
    } catch (error) {
      console.error('Error reading file:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, canceled: true };
});

// Handle file save dialog for PDF export
ipcMain.handle('save-file-dialog', async (event, { defaultPath, pdfData }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Certificate PDF',
    defaultPath: defaultPath || 'certificate.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });
  
  if (!result.canceled && result.filePath) {
    try {
      const buffer = Buffer.from(pdfData, 'base64');
      fs.writeFileSync(result.filePath, buffer);
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Error saving PDF file:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, canceled: true };
});
