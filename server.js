const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 5000;

// Configure CORS for the frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://172.31.128.86:3000'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Configure SQLite database
const dbPath = path.join(__dirname, 'railcertmaster.db');
const db = new sqlite3.Database(dbPath);

// Helper function to run queries
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to run a single SQL statement
const run = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Initialize database
const initDatabase = async () => {
  try {
    // Create customers table
    await run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        nif TEXT UNIQUE,
        quality_manager TEXT,
        quality_manager_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inspectors table
    await run(`
      CREATE TABLE IF NOT EXISTS inspectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create needle_types table
    await run(`
      CREATE TABLE IF NOT EXISTS needle_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create needle_inventory table
    await run(`
      CREATE TABLE IF NOT EXISTS needle_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        needle_type_id INTEGER,
        num TEXT NOT NULL UNIQUE,
        serial_number TEXT,
        description TEXT,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (needle_type_id) REFERENCES needle_types (id)
      )
    `);

    // Create certificates table
    await run(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        certificate_number TEXT NOT NULL UNIQUE,
        material_type TEXT,
        material_grade TEXT,
        customer_id INTEGER,
        inspector_id INTEGER,
        test_date DATE,
        issue_date DATE,
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (inspector_id) REFERENCES inspectors (id)
      )
    `);

    // Create certificate_attachments table
    await run(`
      CREATE TABLE IF NOT EXISTS certificate_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        certificate_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT,
        file_size INTEGER,
        mime_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (certificate_id) REFERENCES certificates (id) ON DELETE CASCADE
      )
    `);

    // Check if default data needs to be inserted
    const needleTypesCount = await runQuery('SELECT COUNT(*) as count FROM needle_types');
    if (needleTypesCount[0].count === 0) {
      // Insert default needle types
      await run(`
        INSERT INTO needle_types (name, description) VALUES 
        ('Tipo A', 'Agujas estándar para vía normal'),
        ('Tipo B', 'Agujas reforzadas para alta velocidad'),
        ('Tipo C', 'Agujas para vía estrecha'),
        ('Tipo D', 'Agujas para cruces especiales'),
        ('Tipo E', 'Agujas de alta resistencia')
      `);

      // Get the IDs of the inserted needle types
      const needleTypes = await runQuery('SELECT id, name FROM needle_types');
      
      // Insert sample needles for each type
      for (const type of needleTypes) {
        const typePrefix = type.name.slice(-1);
        for (let i = 1; i <= 6; i++) {
          const paddedNum = String(i).padStart(4, '0');
          await run(
            'INSERT INTO needle_inventory (needle_type_id, num, serial_number, description) VALUES (?, ?, ?, ?)',
            [
              type.id,
              `${typePrefix}-2023-${paddedNum}`,
              `SN-${typePrefix}${paddedNum}`,
              `Aguja ${type.name} #${i}`
            ]
          );
        }
      }
    }

    // Check if default customers need to be inserted
    const customersCount = await runQuery('SELECT COUNT(*) as count FROM customers');
    if (customersCount[0].count === 0) {
      // Insert default customers
      await run(`
        INSERT INTO customers (name, location, nif, quality_manager, quality_manager_email) VALUES 
        ('Ferrovial S.A.', 'Madrid, España', 'A-12345678', 'Ana Martínez', 'ana.martinez@ferrovial.com'),
        ('Adif', 'Barcelona, España', 'B-87654321', 'Carlos Rodríguez', 'carlos.rodriguez@adif.es'),
        ('Renfe Operadora', 'Sevilla, España', 'C-23456789', 'Laura Sánchez', 'laura.sanchez@renfe.es'),
        ('Construcciones Ferroviarias S.L.', 'Valencia, España', 'D-34567890', 'Miguel González', 'miguel.gonzalez@consferrov.es'),
        ('Talgo', 'Bilbao, España', 'E-45678901', 'Elena López', 'elena.lopez@talgo.com')
      `);
    }

    // Check if default inspectors need to be inserted
    const inspectorsCount = await runQuery('SELECT COUNT(*) as count FROM inspectors');
    if (inspectorsCount[0].count === 0) {
      // Insert default inspectors
      await run(`
        INSERT INTO inspectors (name, code, email) VALUES 
        ('Juan Gómez', 'INSP-001', 'juan.gomez@railcert.es'),
        ('María Fernández', 'INSP-002', 'maria.fernandez@railcert.es'),
        ('Antonio Pérez', 'INSP-003', 'antonio.perez@railcert.es'),
        ('Carmen Díaz', 'INSP-004', 'carmen.diaz@railcert.es'),
        ('Roberto Álvarez', 'INSP-005', 'roberto.alvarez@railcert.es')
      `);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Initialize the database
initDatabase();

// Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM customers LIMIT 1');
    res.json(result);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get company by ID
app.get('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM customers');
    res.json(result);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create a new customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, location, nif, qualityManager, qualityManagerEmail } = req.body;
    
    const result = await run(
      'INSERT INTO customers (name, location, nif, quality_manager, quality_manager_email) VALUES (?, ?, ?, ?, ?)',
      [name, location, nif, qualityManager, qualityManagerEmail]
    );
    
    const newCustomer = await runQuery('SELECT * FROM customers WHERE id = ?', [result.id]);
    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update a customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, nif, qualityManager, qualityManagerEmail } = req.body;
    
    await run(
      'UPDATE customers SET name = ?, location = ?, nif = ?, quality_manager = ?, quality_manager_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, location, nif, qualityManager, qualityManagerEmail, id]
    );
    
    const updatedCustomer = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
    
    if (updatedCustomer.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Get all inspectors
app.get('/api/inspectors', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM inspectors');
    res.json(result);
  } catch (error) {
    console.error('Error fetching inspectors:', error);
    res.status(500).json({ error: 'Failed to fetch inspectors' });
  }
});

// Get inspector by ID
app.get('/api/inspectors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('SELECT * FROM inspectors WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Inspector not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching inspector:', error);
    res.status(500).json({ error: 'Failed to fetch inspector' });
  }
});

// Get all needle types
app.get('/api/needle-types', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM needle_types ORDER BY name');
    res.json(result);
  } catch (error) {
    console.error('Error fetching needle types:', error);
    res.status(500).json({ error: 'Failed to fetch needle types' });
  }
});

// Get all available needles in inventory
app.get('/api/needle-inventory', async (req, res) => {
  try {
    const result = await runQuery(`
      SELECT n.*, t.name as type_name
      FROM needle_inventory n
      JOIN needle_types t ON n.needle_type_id = t.id
      ORDER BY n.num
    `);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching needle inventory:', error);
    res.status(500).json({ error: 'Failed to fetch needle inventory' });
  }
});

// Get needle inventory by type
app.get('/api/needle-inventory/type/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;
    
    const result = await runQuery(`
      SELECT n.*, t.name as type_name
      FROM needle_inventory n
      JOIN needle_types t ON n.needle_type_id = t.id
      WHERE n.needle_type_id = ?
      ORDER BY n.num
    `, [typeId]);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching needles by type:', error);
    res.status(500).json({ error: 'Failed to fetch needles by type' });
  }
});

// Search needles by num
app.get('/api/needle-inventory/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const result = await runQuery(`
      SELECT n.*, t.name as type_name
      FROM needle_inventory n
      JOIN needle_types t ON n.needle_type_id = t.id
      WHERE n.num LIKE ? OR n.serial_number LIKE ?
      ORDER BY n.num
    `, [`%${query}%`, `%${query}%`]);
    
    res.json(result);
  } catch (error) {
    console.error('Error searching needles:', error);
    res.status(500).json({ error: 'Failed to search needles' });
  }
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const result = await runQuery(`
      SELECT c.*, cust.name as customer_name, i.name as inspector_name 
      FROM certificates c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN inspectors i ON c.inspector_id = i.id
      ORDER BY c.created_at DESC
    `);
    res.json(result);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Endpoint para obtener un certificado específico con sus datos relacionados
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Consulta para obtener el certificado y sus datos relacionados
    const result = await runQuery(
      `SELECT 
        c.*,
        cust.name as customer_name,
        cust.location as customer_location,
        cust.nif as customer_nif,
        cust.quality_manager as customer_quality_manager,
        cust.quality_manager_email as customer_quality_manager_email,
        insp.name as inspector_name,
        insp.code as inspector_code,
        insp.email as inspector_email
      FROM certificates c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN inspectors insp ON c.inspector_id = insp.id
      WHERE c.id = ?`,
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Certificado no encontrado"
      });
    }

    // Obtenemos los archivos adjuntos
    const attachmentsResult = await runQuery(
      `SELECT * FROM certificate_attachments WHERE certificate_id = ?`,
      [id]
    );

    // Combinamos los datos
    const certificateData = {
      ...result[0],
      attachments: attachmentsResult
    };

    res.json({
      success: true,
      data: certificateData
    });
  } catch (error) {
    console.error("Error al obtener certificado:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el certificado",
      error: error.message
    });
  }
});

// Create new certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const {
      certificate_number,
      material_type,
      material_grade,
      customer_id,
      inspector_id,
      test_date,
      issue_date,
      comments,
      attachments
    } = req.body;

    // Guardamos el certificado 
    const result = await run(
      `INSERT INTO certificates (
        certificate_number, 
        material_type, 
        material_grade, 
        customer_id,
        inspector_id, 
        test_date, 
        issue_date, 
        comments,
        created_at,
        updated_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        certificate_number,
        material_type,
        material_grade,
        customer_id,
        inspector_id,
        test_date,
        issue_date,
        comments
      ]
    );

    // Si hay archivos adjuntos, los guardamos
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await run(
          `INSERT INTO certificate_attachments (
            certificate_id, 
            filename, 
            original_name, 
            file_size, 
            mime_type,
            created_at
          ) 
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            result.id,
            attachment.filename,
            attachment.originalName,
            attachment.fileSize,
            attachment.mimeType
          ]
        );
      }
    }

    const newCertificate = await runQuery('SELECT * FROM certificates WHERE id = ?', [result.id]);
    res.status(201).json({
      success: true,
      data: newCertificate[0]
    });
  } catch (error) {
    console.error("Error al crear certificado:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el certificado",
      error: error.message
    });
  }
});

// Endpoint para inicializar la base de datos
app.post('/api/initialize-database', async (req, res) => {
  try {
    console.log('Inicializando la base de datos...');
    
    await initDatabase();
    
    console.log('Base de datos inicializada correctamente');
    res.json({
      success: true,
      message: 'Base de datos inicializada correctamente'
    });
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    res.status(500).json({
      success: false,
      error: `Error al inicializar la base de datos: ${error.message}`
    });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});