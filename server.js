const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 5000;

// Middleware manual para CORS para asegurar que las solicitudes preflight funcionen
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Responder inmediatamente a las solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
    // Tabla de inspectores
    await run(`
      CREATE TABLE IF NOT EXISTS inspectores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_inspector TEXT UNIQUE,
        nombre TEXT NOT NULL,
        email TEXT,
        logo_sello BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de tipos de materiales
    await run(`
      CREATE TABLE IF NOT EXISTS tipos_materiales (
        id_tipo_material INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de fabricantes
    await run(`
      CREATE TABLE IF NOT EXISTS fabricantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        ubicacion TEXT,
        contacto TEXT,
        email TEXT,
        nif TEXT UNIQUE,
        responsable_calidad TEXT,
        email_responsable_calidad TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de clientes
    await run(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        ubicacion TEXT,
        nif TEXT UNIQUE,
        responsable_calidad TEXT,
        email_responsable_calidad TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de relación fabricante-cliente
    await run(`
      CREATE TABLE IF NOT EXISTS relacion_fabricante_cliente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fabricante_id INTEGER NOT NULL,
        cliente_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        UNIQUE(fabricante_id, cliente_id)
      )
    `);

    // Tabla de PDFs
    await run(`
      CREATE TABLE IF NOT EXISTS pdfs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_tipo_pdf TEXT NOT NULL,
        pdf_blob BLOB,
        nombre_pdf TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de designaciones
    await run(`
      CREATE TABLE IF NOT EXISTS designaciones (
        id_designacion INTEGER PRIMARY KEY AUTOINCREMENT,
        matricula TEXT NOT NULL,
        descripcion TEXT,
        tipo_material_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tipo_material_id) REFERENCES tipos_materiales(id_tipo_material)
      )
    `);

    // Tabla de certificados
    await run(`
      CREATE TABLE IF NOT EXISTS certificados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_certificado TEXT NOT NULL UNIQUE,
        fecha DATE,
        fabricante_id INTEGER,
        cliente_id INTEGER,
        pedido_interno TEXT,
        tipo_material_id INTEGER,
        codigo_inspector INTEGER,
        id_pdf_certificado INTEGER,
        firmado BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (tipo_material_id) REFERENCES tipos_materiales(id_tipo_material),
        FOREIGN KEY (codigo_inspector) REFERENCES inspectores(id),
        FOREIGN KEY (id_pdf_certificado) REFERENCES pdfs(id)
      )
    `);

    // Tabla de agujas
    await run(`
      CREATE TABLE IF NOT EXISTS agujas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        num_aguja TEXT NOT NULL UNIQUE,
        fabricante_id INTEGER,
        colada TEXT,
        certificado_id INTEGER,
        cliente_id INTEGER,
        pdf_dureza INTEGER,
        pdf_ensayo_particulas INTEGER,
        pdf_planilla INTEGER,
        pdf_medicion INTEGER,
        designacion_id INTEGER,
        firmado BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id),
        FOREIGN KEY (certificado_id) REFERENCES certificados(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (pdf_dureza) REFERENCES pdfs(id),
        FOREIGN KEY (pdf_ensayo_particulas) REFERENCES pdfs(id),
        FOREIGN KEY (pdf_planilla) REFERENCES pdfs(id),
        FOREIGN KEY (pdf_medicion) REFERENCES pdfs(id),
        FOREIGN KEY (designacion_id) REFERENCES designaciones(id_designacion)
      ) 
    `);

    // Tabla de relación certificado-agujas
    await run(`
      CREATE TABLE IF NOT EXISTS relacion_certificado_agujas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        certificado_id INTEGER NOT NULL,
        aguja_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (certificado_id) REFERENCES certificados(id) ON DELETE CASCADE,
        FOREIGN KEY (aguja_id) REFERENCES agujas(id) ON DELETE CASCADE,
        UNIQUE(certificado_id, aguja_id)
      )
    `);

    // Tabla de roles de usuario
    await run(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de usuarios
    await run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        fabricante_id INTEGER,
        rol_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id),
        FOREIGN KEY (rol_id) REFERENCES roles(id)
      )
    `);

    // Check if default data needs to be inserted
    const tiposMaterialesCount = await runQuery('SELECT COUNT(*) as count FROM tipos_materiales');
    if (tiposMaterialesCount[0].count === 0) {
      // Insert default material types
      await run(`
        INSERT INTO tipos_materiales (nombre, descripcion) VALUES 
        ('Agujas', 'Agujas ferroviarias de distintos tipos'),
        ('Juntas', 'Juntas para vías ferroviarias'),
        ('Carriles', 'Carriles para vías ferroviarias'),
        ('Tirafondos', 'Tornillos especiales para fijar los carriles a las traviesas'),
        ('Traviesas', 'Elementos transversales que soportan los carriles')
      `);
    }

    // Check if default customers need to be inserted
    const clientesCount = await runQuery('SELECT COUNT(*) as count FROM clientes');
    if (clientesCount[0].count === 0) {
      // Insert default customers
      await run(`
        INSERT INTO clientes (nombre, ubicacion, nif, responsable_calidad, email_responsable_calidad) VALUES 
        ('Ferrovial S.A.', 'Madrid, España', 'A-12345678', 'Ana Martínez', 'ana.martinez@ferrovial.com'),
        ('Adif', 'Barcelona, España', 'B-87654321', 'Carlos Rodríguez', 'carlos.rodriguez@adif.es'),
        ('Renfe Operadora', 'Sevilla, España', 'C-23456789', 'Laura Sánchez', 'laura.sanchez@renfe.es'),
        ('Construcciones Ferroviarias S.L.', 'Valencia, España', 'D-34567890', 'Miguel González', 'miguel.gonzalez@consferrov.es'),
        ('Talgo', 'Bilbao, España', 'E-45678901', 'Elena López', 'elena.lopez@talgo.com')
      `);
    }

    // Check if default fabricantes need to be inserted
    const fabricantesCount = await runQuery('SELECT COUNT(*) as count FROM fabricantes');
    if (fabricantesCount[0].count === 0) {
      // Insert default fabricantes
      await run(`
        INSERT INTO fabricantes (nombre, ubicacion, contacto, email) VALUES 
        ('Talleres Alegría', 'Asturias, España', 'Carlos Fernández', 'info@talleresalegria.com'),
        ('JEZ Sistemas Ferroviarios', 'País Vasco, España', 'María López', 'contacto@jez.es'),
        ('AMURRIO Ferrocarril', 'Álava, España', 'Juan Rodríguez', 'contacto@amurrio.es'),
        ('Vossloh España', 'Valencia, España', 'Pedro Martínez', 'info@vossloh.es'),
        ('ArcelorMittal Rails', 'Madrid, España', 'Elena García', 'rails@arcelormittal.com')
      `);
    }

    // Check if default inspectors need to be inserted
    const inspectoresCount = await runQuery('SELECT COUNT(*) as count FROM inspectores');
    if (inspectoresCount[0].count === 0) {
      // Insert default inspectors
      await run(`
        INSERT INTO inspectores (codigo_inspector, nombre, email) VALUES 
        ('INSP-001', 'Juan Gómez', 'juan.gomez@railcert.es'),
        ('INSP-002', 'María Fernández', 'maria.fernandez@railcert.es'),
        ('INSP-003', 'Antonio Pérez', 'antonio.perez@railcert.es'),
        ('INSP-004', 'Carmen Díaz', 'carmen.diaz@railcert.es'),
        ('INSP-005', 'Roberto Álvarez', 'roberto.alvarez@railcert.es')
      `);
    }

    // Check if default designaciones need to be inserted
    const designacionesCount = await runQuery('SELECT COUNT(*) as count FROM designaciones');
    if (designacionesCount[0].count === 0) {
      // Get material type id for Agujas
      const tipoAguja = await runQuery("SELECT id_tipo_material FROM tipos_materiales WHERE nombre = 'Agujas'");
      if (tipoAguja.length > 0) {
        const tipoAgujaId = tipoAguja[0].id_tipo_material;
        // Insert default designaciones
        await run(`
          INSERT INTO designaciones (matricula, descripcion, tipo_material_id) VALUES 
          ('DSA-54', 'Desvío simple tipo A - UIC 54', ?),
          ('DSB-60', 'Desvío simple tipo B - UIC 60', ?),
          ('TG-54', 'Travesía con uniones - UIC 54', ?)
        `, [tipoAgujaId, tipoAgujaId, tipoAgujaId]);
      }
    }

    // Insert relaciones fabricante-cliente
    const relacionesCount = await runQuery('SELECT COUNT(*) as count FROM relacion_fabricante_cliente');
    if (relacionesCount[0].count === 0) {
      // Get some fabricantes and clientes
      const talleresAlegria = await runQuery("SELECT id FROM fabricantes WHERE nombre = 'Talleres Alegría'");
      const jezSistemas = await runQuery("SELECT id FROM fabricantes WHERE nombre = 'JEZ Sistemas Ferroviarios'");
      const amurrio = await runQuery("SELECT id FROM fabricantes WHERE nombre = 'AMURRIO Ferrocarril'");
      
      const adif = await runQuery("SELECT id FROM clientes WHERE nombre = 'Adif'");
      const renfe = await runQuery("SELECT id FROM clientes WHERE nombre = 'Renfe Operadora'");
      const ferrovial = await runQuery("SELECT id FROM clientes WHERE nombre = 'Ferrovial S.A.'");
      
      // Insert relationships if we have the data
      if (talleresAlegria.length > 0 && adif.length > 0) {
        await run('INSERT INTO relacion_fabricante_cliente (fabricante_id, cliente_id) VALUES (?, ?)', 
          [talleresAlegria[0].id, adif[0].id]);
      }
      if (jezSistemas.length > 0 && renfe.length > 0) {
        await run('INSERT INTO relacion_fabricante_cliente (fabricante_id, cliente_id) VALUES (?, ?)', 
          [jezSistemas[0].id, renfe[0].id]);
      }
      if (amurrio.length > 0 && ferrovial.length > 0) {
        await run('INSERT INTO relacion_fabricante_cliente (fabricante_id, cliente_id) VALUES (?, ?)', 
          [amurrio[0].id, ferrovial[0].id]);
      }
    }

    // Verificar e insertar roles de usuario por defecto
    const rolesCount = await runQuery('SELECT COUNT(*) as count FROM roles');
    if (rolesCount[0].count === 0) {
      // Insertar roles por defecto
      await run(`
        INSERT INTO roles (nombre, descripcion) VALUES 
        ('admin', 'Administrador del sistema con acceso completo'),
        ('fabricante', 'Usuario de empresa fabricante'),
        ('consultor', 'Usuario con permisos solo de consulta')
      `);
    }

    // Verificar e insertar usuarios de prueba
    const usuariosCount = await runQuery('SELECT COUNT(*) as count FROM usuarios');
    if (usuariosCount[0].count === 0) {
      // Obtener IDs de roles
      const rolAdmin = await runQuery("SELECT id FROM roles WHERE nombre = 'admin'");
      const rolFabricante = await runQuery("SELECT id FROM roles WHERE nombre = 'fabricante'");
      
      // Obtener IDs de fabricantes
      const fabricantes = await runQuery("SELECT id FROM fabricantes LIMIT 3");
      
      // Contraseña simple para pruebas (en producción usaríamos bcrypt)
      const passwordTemporal = '123456';
      
      // Insertar usuario administrador
      if (rolAdmin.length > 0) {
        await run(`
          INSERT INTO usuarios (nombre, email, password, rol_id) 
          VALUES (?, ?, ?, ?)
        `, ['Admin', 'admin@railcertmaster.com', passwordTemporal, rolAdmin[0].id]);
      }
      
      // Insertar usuarios de tipo fabricante
      if (rolFabricante.length > 0 && fabricantes.length > 0) {
        for (let i = 0; i < fabricantes.length; i++) {
          await run(`
            INSERT INTO usuarios (nombre, email, password, fabricante_id, rol_id) 
            VALUES (?, ?, ?, ?, ?)
          `, [
            `Usuario Fabricante ${i+1}`, 
            `fabricante${i+1}@ejemplo.com`, 
            passwordTemporal, 
            fabricantes[i].id, 
            rolFabricante[0].id
          ]);
        }
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Initialize the database
initDatabase();

// Get all companies (fabricantes)
app.get('/api/companies', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM fabricantes');
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
    const result = await runQuery('SELECT * FROM fabricantes WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Crear un nuevo fabricante
app.post('/api/companies', async (req, res) => {
  try {
    const { 
      nombre, 
      ubicacion, 
      nif, 
      responsable_calidad, 
      email_responsable_calidad 
    } = req.body;
    
    const result = await run(
      `INSERT INTO fabricantes 
        (nombre, ubicacion, nif, responsable_calidad, email_responsable_calidad) 
      VALUES (?, ?, ?, ?, ?)`,
      [nombre, ubicacion, nif, responsable_calidad, email_responsable_calidad]
    );
    
    const newCompany = await runQuery('SELECT * FROM fabricantes WHERE id = ?', [result.id]);
    res.status(201).json(newCompany[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Actualizar un fabricante
app.put('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      ubicacion, 
      nif, 
      responsable_calidad, 
      email_responsable_calidad 
    } = req.body;
    
    await run(
      `UPDATE fabricantes 
      SET nombre = ?, ubicacion = ?, nif = ?, 
          responsable_calidad = ?, email_responsable_calidad = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [nombre, ubicacion, nif, responsable_calidad, email_responsable_calidad, id]
    );
    
    const updatedCompany = await runQuery('SELECT * FROM fabricantes WHERE id = ?', [id]);
    
    if (updatedCompany.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(updatedCompany[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Eliminar un fabricante
app.delete('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay usuarios asociados al fabricante
    const usuariosAsociados = await runQuery('SELECT COUNT(*) as count FROM usuarios WHERE fabricante_id = ?', [id]);
    if (usuariosAsociados[0].count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el fabricante porque hay usuarios asociados a él' 
      });
    }
    
    await run('DELETE FROM fabricantes WHERE id = ?', [id]);
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM clientes');
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
    const result = await runQuery('SELECT * FROM clientes WHERE id = ?', [id]);
    
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
    const { nombre, ubicacion, nif, responsableCalidad, emailResponsableCalidad } = req.body;
    
    const result = await run(
      'INSERT INTO clientes (nombre, ubicacion, nif, responsable_calidad, email_responsable_calidad) VALUES (?, ?, ?, ?, ?)',
      [nombre, ubicacion, nif, responsableCalidad, emailResponsableCalidad]
    );
    
    const newCustomer = await runQuery('SELECT * FROM clientes WHERE id = ?', [result.id]);
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
    const { nombre, ubicacion, nif, responsableCalidad, emailResponsableCalidad } = req.body;
    
    await run(
      'UPDATE clientes SET nombre = ?, ubicacion = ?, nif = ?, responsable_calidad = ?, email_responsable_calidad = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nombre, ubicacion, nif, responsableCalidad, emailResponsableCalidad, id]
    );
    
    const updatedCustomer = await runQuery('SELECT * FROM clientes WHERE id = ?', [id]);
    
    if (updatedCustomer.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete a customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await run('DELETE FROM clientes WHERE id = ?', [id]);
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Get all inspectors
app.get('/api/inspectors', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM inspectores');
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
    const result = await runQuery('SELECT * FROM inspectores WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Inspector not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching inspector:', error);
    res.status(500).json({ error: 'Failed to fetch inspector' });
  }
});

// Create a new inspector
app.post('/api/inspectors', async (req, res) => {
  try {
    const { nombre, codigoInspector, email, logoSello } = req.body;
    
    const result = await run(
      'INSERT INTO inspectores (nombre, codigo_inspector, email, logo_sello) VALUES (?, ?, ?, ?)',
      [nombre, codigoInspector, email, logoSello]
    );
    
    const newInspector = await runQuery('SELECT * FROM inspectores WHERE id = ?', [result.id]);
    res.status(201).json(newInspector[0]);
  } catch (error) {
    console.error('Error creating inspector:', error);
    res.status(500).json({ error: 'Failed to create inspector' });
  }
});

// Update an inspector
app.put('/api/inspectors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigoInspector, email, logoSello } = req.body;
    
    await run(
      'UPDATE inspectores SET nombre = ?, codigo_inspector = ?, email = ?, logo_sello = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nombre, codigoInspector, email, logoSello, id]
    );
    
    const updatedInspector = await runQuery('SELECT * FROM inspectores WHERE id = ?', [id]);
    
    if (updatedInspector.length === 0) {
      return res.status(404).json({ error: 'Inspector not found' });
    }
    
    res.json(updatedInspector[0]);
  } catch (error) {
    console.error('Error updating inspector:', error);
    res.status(500).json({ error: 'Failed to update inspector' });
  }
});

// Get all tipos_materiales
app.get('/api/material-types', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM tipos_materiales');
    res.json(result);
  } catch (error) {
    console.error('Error fetching material types:', error);
    res.status(500).json({ error: 'Failed to fetch material types' });
  }
});

// Get tipo_material by ID
app.get('/api/material-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('SELECT * FROM tipos_materiales WHERE id_tipo_material = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Material type not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching material type:', error);
    res.status(500).json({ error: 'Failed to fetch material type' });
  }
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const result = await runQuery(`
      SELECT 
        c.*,
        f.nombre as fabricante_nombre,
        cl.nombre as cliente_nombre,
        tm.nombre as tipo_material_nombre,
        i.nombre as inspector_nombre
      FROM certificados c
      LEFT JOIN fabricantes f ON c.fabricante_id = f.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN tipos_materiales tm ON c.tipo_material_id = tm.id_tipo_material
      LEFT JOIN inspectores i ON c.codigo_inspector = i.id
    `);
    res.json(result);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Get certificate by ID
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery(`
      SELECT 
        c.*,
        f.nombre as fabricante_nombre,
        cl.nombre as cliente_nombre,
        tm.nombre as tipo_material_nombre,
        i.nombre as inspector_nombre
      FROM certificados c
      LEFT JOIN fabricantes f ON c.fabricante_id = f.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN tipos_materiales tm ON c.tipo_material_id = tm.id_tipo_material
      LEFT JOIN inspectores i ON c.codigo_inspector = i.id
      WHERE c.id = ?
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Create a new certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const { 
      numeroCertificado, 
      fecha, 
      fabricanteId, 
      clienteId, 
      pedidoInterno, 
      tipoMaterialId, 
      codigoInspector, 
      idPdfCertificado,
      firmado 
    } = req.body;
    
    const result = await run(
      `INSERT INTO certificados 
        (numero_certificado, fecha, fabricante_id, cliente_id, pedido_interno, 
        tipo_material_id, codigo_inspector, id_pdf_certificado, firmado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numeroCertificado, fecha, fabricanteId, clienteId, pedidoInterno, 
        tipoMaterialId, codigoInspector, idPdfCertificado, firmado ? 1 : 0]
    );
    
    const newCertificate = await runQuery(`
      SELECT 
        c.*,
        f.nombre as fabricante_nombre,
        cl.nombre as cliente_nombre,
        tm.nombre as tipo_material_nombre,
        i.nombre as inspector_nombre
      FROM certificados c
      LEFT JOIN fabricantes f ON c.fabricante_id = f.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN tipos_materiales tm ON c.tipo_material_id = tm.id_tipo_material
      LEFT JOIN inspectores i ON c.codigo_inspector = i.id
      WHERE c.id = ?
    `, [result.id]);
    
    res.status(201).json(newCertificate[0]);
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
});

// Get all agujas
app.get('/api/agujas', async (req, res) => {
  try {
    const result = await runQuery(`
      SELECT 
        a.*,
        f.nombre as fabricante_nombre,
        cl.nombre as cliente_nombre,
        cert.numero_certificado,
        d.matricula as designacion_matricula
      FROM agujas a
      LEFT JOIN fabricantes f ON a.fabricante_id = f.id
      LEFT JOIN clientes cl ON a.cliente_id = cl.id
      LEFT JOIN certificados cert ON a.certificado_id = cert.id
      LEFT JOIN designaciones d ON a.designacion_id = d.id_designacion
    `);
    res.json(result);
  } catch (error) {
    console.error('Error fetching agujas:', error);
    res.status(500).json({ error: 'Failed to fetch agujas' });
  }
});

// Get aguja by ID
app.get('/api/agujas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery(`
      SELECT 
        a.*,
        f.nombre as fabricante_nombre,
        cl.nombre as cliente_nombre,
        cert.numero_certificado,
        d.matricula as designacion_matricula
      FROM agujas a
      LEFT JOIN fabricantes f ON a.fabricante_id = f.id
      LEFT JOIN clientes cl ON a.cliente_id = cl.id
      LEFT JOIN certificados cert ON a.certificado_id = cert.id
      LEFT JOIN designaciones d ON a.designacion_id = d.id_designacion
      WHERE a.id = ?
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Aguja not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching aguja:', error);
    res.status(500).json({ error: 'Failed to fetch aguja' });
  }
});

// Create a new aguja
app.post('/api/agujas', async (req, res) => {
  try {
    const { 
      numAguja, 
      fabricanteId, 
      colada, 
      certificadoId, 
      clienteId, 
      pdfDureza, 
      pdfEnsayoParticulas, 
      pdfPlanilla, 
      pdfMedicion, 
      designacionId, 
      firmado 
    } = req.body;
    
    const result = await run(
      `INSERT INTO agujas 
        (num_aguja, fabricante_id, colada, certificado_id, cliente_id, 
        pdf_dureza, pdf_ensayo_particulas, pdf_planilla, pdf_medicion, 
        designacion_id, firmado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numAguja, fabricanteId, colada, certificadoId, clienteId, 
       pdfDureza, pdfEnsayoParticulas, pdfPlanilla, pdfMedicion, 
       designacionId, firmado ? 1 : 0]
    );
    
    // If certificadoId is provided, create entry in relacion_certificado_agujas
    if (certificadoId) {
      await run(
        'INSERT INTO relacion_certificado_agujas (certificado_id, aguja_id) VALUES (?, ?)',
        [certificadoId, result.id]
      );
    }
    
    const newAguja = await runQuery(`
      SELECT 
        a.*,
        f.nombre as fabricante_nombre,
        cl.nombre as cliente_nombre,
        cert.numero_certificado,
        d.matricula as designacion_matricula
      FROM agujas a
      LEFT JOIN fabricantes f ON a.fabricante_id = f.id
      LEFT JOIN clientes cl ON a.cliente_id = cl.id
      LEFT JOIN certificados cert ON a.certificado_id = cert.id
      LEFT JOIN designaciones d ON a.designacion_id = d.id_designacion
      WHERE a.id = ?
    `, [result.id]);
    
    res.status(201).json(newAguja[0]);
  } catch (error) {
    console.error('Error creating aguja:', error);
    res.status(500).json({ error: 'Failed to create aguja' });
  }
});

// Get all designaciones
app.get('/api/designaciones', async (req, res) => {
  try {
    const result = await runQuery(`
      SELECT 
        d.*,
        tm.nombre as tipo_material_nombre
      FROM designaciones d
      LEFT JOIN tipos_materiales tm ON d.tipo_material_id = tm.id_tipo_material
    `);
    res.json(result);
  } catch (error) {
    console.error('Error fetching designaciones:', error);
    res.status(500).json({ error: 'Failed to fetch designaciones' });
  }
});

// Store PDF
app.post('/api/pdfs', async (req, res) => {
  try {
    const { codigoTipoPdf, pdfBlob, nombrePdf } = req.body;
    
    const result = await run(
      'INSERT INTO pdfs (codigo_tipo_pdf, pdf_blob, nombre_pdf) VALUES (?, ?, ?)',
      [codigoTipoPdf, pdfBlob, nombrePdf]
    );
    
    const newPdf = await runQuery('SELECT id, codigo_tipo_pdf, nombre_pdf, created_at FROM pdfs WHERE id = ?', [result.id]);
    res.status(201).json(newPdf[0]);
  } catch (error) {
    console.error('Error storing PDF:', error);
    res.status(500).json({ error: 'Failed to store PDF' });
  }
});

// Get PDF by ID
app.get('/api/pdfs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('SELECT * FROM pdfs WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

// Ruta para obtener todos los PDFs (para la tabla de PDFs)
app.get('/api/pdfs', async (req, res) => {
  try {
    const pdfs = await runQuery(
      'SELECT id, nombre_pdf, codigo_tipo_pdf, created_at FROM pdfs ORDER BY created_at DESC'
    );
    
    res.json(pdfs.rows || pdfs);
  } catch (error) {
    console.error('Error al obtener PDFs:', error);
    res.status(500).json({ error: 'Error al obtener PDFs' });
  }
});

// ----- RUTAS PARA USUARIOS Y AUTENTICACIÓN -----

// Ruta para iniciar sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario por email
    const usuarios = await runQuery(
      `SELECT 
        u.*,
        r.nombre as rol_nombre,
        f.nombre as fabricante_nombre,
        f.id as fabricante_id,
        f.responsable_calidad,
        f.email_responsable_calidad,
        f.nif,
        f.ubicacion as fabricante_ubicacion
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN fabricantes f ON u.fabricante_id = f.id
      WHERE u.email = ?`,
      [email]
    );
    
    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const usuario = usuarios[0];
    
    // Verificar contraseña (en producción usaríamos bcrypt.compare)
    if (password !== usuario.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Actualizar timestamp de último login
    await run(
      'UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [usuario.id]
    );

    // Crear objeto de empresa para el frontend si el usuario pertenece a un fabricante
    let companyData = null;
    if (usuario.fabricante_id) {
      companyData = {
        id: usuario.fabricante_id,
        companyName: usuario.fabricante_nombre,
        location: usuario.fabricante_ubicacion,
        responsableCalidad: usuario.responsable_calidad,
        emailResponsableCalidad: usuario.email_responsable_calidad,
        nif: usuario.nif
      };
    }
    
    // Eliminar la contraseña del objeto de respuesta
    delete usuario.password;
    
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token: `${usuario.id}-${Date.now()}`, // Generamos un token simple (en producción usaríamos JWT)
      user: {
        ...usuario,
        company: companyData
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud de inicio de sesión' });
  }
});

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await runQuery(
      `SELECT 
        u.id, u.nombre, u.email, u.created_at,
        r.nombre as rol_nombre,
        f.nombre as fabricante_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN fabricantes f ON u.fabricante_id = f.id
      ORDER BY u.created_at DESC`
    );
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuarios = await runQuery(
      `SELECT 
        u.id, u.nombre, u.email, u.fabricante_id, u.rol_id, u.created_at,
        r.nombre as rol_nombre,
        f.nombre as fabricante_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN fabricantes f ON u.fabricante_id = f.id
      WHERE u.id = ?`,
      [id]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // No enviamos la contraseña por razones de seguridad
    const usuario = usuarios[0];
    
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { 
      nombre, 
      email, 
      password, 
      fabricante_id, 
      rol_id
    } = req.body;
    
    // Verificar si el email ya existe
    const usuarioExistente = await runQuery('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (usuarioExistente.length > 0) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    
    // Insertar nuevo usuario
    const result = await run(
      `INSERT INTO usuarios 
        (nombre, email, password, fabricante_id, rol_id) 
      VALUES (?, ?, ?, ?, ?)`,
      [nombre, email, password, fabricante_id || null, rol_id]
    );
    
    const nuevoUsuario = await runQuery(
      `SELECT 
        u.id, u.nombre, u.email, u.created_at,
        r.nombre as rol_nombre,
        f.nombre as fabricante_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN fabricantes f ON u.fabricante_id = f.id
      WHERE u.id = ?`,
      [result.id]
    );
    
    res.status(201).json(nuevoUsuario[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      email, 
      password, 
      fabricante_id, 
      rol_id
    } = req.body;
    
    // Verificar si el usuario existe
    const usuarioExistente = await runQuery('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (usuarioExistente.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Construir la consulta de actualización
    let updateQuery = 'UPDATE usuarios SET ';
    const updateParams = [];
    const fieldsToUpdate = [];
    
    if (nombre !== undefined) {
      fieldsToUpdate.push('nombre = ?');
      updateParams.push(nombre);
    }
    
    if (email !== undefined) {
      // Verificar que el email no esté en uso por otro usuario
      const emailEnUso = await runQuery('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, id]);
      if (emailEnUso.length > 0) {
        return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
      }
      
      fieldsToUpdate.push('email = ?');
      updateParams.push(email);
    }
    
    if (password !== undefined && password !== '') {
      fieldsToUpdate.push('password = ?');
      updateParams.push(password);
    }
    
    if (fabricante_id !== undefined) {
      fieldsToUpdate.push('fabricante_id = ?');
      updateParams.push(fabricante_id === null ? null : fabricante_id);
    }
    
    if (rol_id !== undefined) {
      fieldsToUpdate.push('rol_id = ?');
      updateParams.push(rol_id);
    }
    
    fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
    
    updateQuery += fieldsToUpdate.join(', ') + ' WHERE id = ?';
    updateParams.push(id);
    
    // Actualizar usuario
    await run(updateQuery, updateParams);
    
    const usuarioActualizado = await runQuery(
      `SELECT 
        u.id, u.nombre, u.email, u.created_at, u.updated_at,
        r.nombre as rol_nombre,
        f.nombre as fabricante_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN fabricantes f ON u.fabricante_id = f.id
      WHERE u.id = ?`,
      [id]
    );
    
    res.json(usuarioActualizado[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el usuario existe
    const usuarioExistente = await runQuery('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (usuarioExistente.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Eliminar usuario
    await run('DELETE FROM usuarios WHERE id = ?', [id]);
    
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Obtener todos los roles
app.get('/api/roles', async (req, res) => {
  try {
    const roles = await runQuery('SELECT * FROM roles');
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// Get customers by company ID (fabricante)
app.get('/api/companies/:id/customers', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el fabricante existe
    const fabricante = await runQuery('SELECT id FROM fabricantes WHERE id = ?', [id]);
    if (fabricante.length === 0) {
      return res.status(404).json({ error: 'Fabricante no encontrado' });
    }
    
    // Obtener los clientes relacionados con este fabricante
    const clientes = await runQuery(`
      SELECT c.* 
      FROM clientes c
      INNER JOIN relacion_fabricante_cliente rfc ON c.id = rfc.cliente_id
      WHERE rfc.fabricante_id = ?
    `, [id]);
    
    res.json(clientes);
  } catch (error) {
    console.error('Error obteniendo clientes por fabricante:', error);
    res.status(500).json({ error: 'Error al obtener clientes por fabricante' });
  }
});

// Get needle inventory
app.get('/api/needle-inventory', async (req, res) => {
  try {
    const sql = `
      SELECT n.id, n.num_aguja as num, n.colada as description, f.id as company_id, f.nombre as company_name
      FROM agujas n
      LEFT JOIN fabricantes f ON n.fabricante_id = f.id
    `;
    
    const rows = await db.all(sql);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener inventario de agujas:', error);
    res.status(500).json({ error: 'Error al obtener inventario de agujas' });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});