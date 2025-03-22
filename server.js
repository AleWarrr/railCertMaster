const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 5000;

// Configure CORS for the frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://172.31.128.86:3000'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get company by ID
app.get('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Get all inspectors
app.get('/api/inspectors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inspectors');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inspectors:', error);
    res.status(500).json({ error: 'Failed to fetch inspectors' });
  }
});

// Get inspector by ID
app.get('/api/inspectors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM inspectors WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inspector not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching inspector:', error);
    res.status(500).json({ error: 'Failed to fetch inspector' });
  }
});

// Get all needle types
app.get('/api/needle-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM needle_types');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching needle types:', error);
    res.status(500).json({ error: 'Failed to fetch needle types' });
  }
});

// Get all available needles in inventory
app.get('/api/needle-inventory', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ni.*, nt.name, nt.specification 
      FROM needle_inventory ni
      JOIN needle_types nt ON ni.needle_type_id = nt.id
      WHERE ni.status = 'available'
      ORDER BY ni.needle_type_id, ni.serial_number
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching needle inventory:', error);
    res.status(500).json({ error: 'Failed to fetch needle inventory' });
  }
});

// Get needle inventory by type
app.get('/api/needle-inventory/type/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;
    const result = await pool.query(`
      SELECT ni.*, nt.name, nt.specification 
      FROM needle_inventory ni
      JOIN needle_types nt ON ni.needle_type_id = nt.id
      WHERE ni.needle_type_id = $1 AND ni.status = 'available'
      ORDER BY ni.serial_number
    `, [typeId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching needle inventory by type:', error);
    res.status(500).json({ error: 'Failed to fetch needle inventory' });
  }
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cust.name as customer_name, i.name as inspector_name 
      FROM certificates c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN inspectors i ON c.inspector_id = i.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Get certificate by ID
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get certificate data
      const certResult = await client.query(`
        SELECT c.*, cust.name as customer_name, i.name as inspector_name 
        FROM certificates c
        LEFT JOIN customers cust ON c.customer_id = cust.id
        LEFT JOIN inspectors i ON c.inspector_id = i.id
        WHERE c.id = $1
      `, [id]);
      
      if (certResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Certificate not found' });
      }
      
      // Get certificate needles
      const needlesResult = await client.query(`
        SELECT cn.*, nt.name, nt.specification
        FROM certificate_needles cn
        JOIN needle_types nt ON cn.needle_type_id = nt.id
        WHERE cn.certificate_id = $1
      `, [id]);
      
      // Get certificate attachments
      const attachmentsResult = await client.query(`
        SELECT * FROM certificate_attachments
        WHERE certificate_id = $1
      `, [id]);
      
      await client.query('COMMIT');
      
      const certificate = {
        ...certResult.rows[0],
        needles: needlesResult.rows,
        attachments: attachmentsResult.rows
      };
      
      res.json(certificate);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Create new certificate
app.post('/api/certificates', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      date,
      customer_id,
      reference_number,
      date_of_sale,
      order_number,
      destination_store,
      destination_address,
      inspector_id,
      needles,
      status = 'draft'
    } = req.body;
    
    await client.query('BEGIN');
    
    // Generate certificate number (Year-Month-SequentialNumber)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Get last certificate number this month
    const lastCertQuery = await client.query(
      "SELECT certificate_number FROM certificates WHERE certificate_number LIKE $1 ORDER BY certificate_number DESC LIMIT 1",
      [`${year}-${month}-%`]
    );
    
    let sequenceNumber = 1;
    if (lastCertQuery.rows.length > 0) {
      const lastNumber = parseInt(lastCertQuery.rows[0].certificate_number.split('-')[2], 10);
      sequenceNumber = lastNumber + 1;
    }
    
    const certificateNumber = `${year}-${month}-${String(sequenceNumber).padStart(4, '0')}`;
    const certificateId = uuidv4();
    
    // Insert certificate
    await client.query(
      `INSERT INTO certificates 
       (id, certificate_number, date, customer_id, reference_number, date_of_sale, 
       order_number, destination_store, destination_address, inspector_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        certificateId,
        certificateNumber,
        date,
        customer_id,
        reference_number,
        date_of_sale,
        order_number,
        destination_store,
        destination_address,
        inspector_id,
        status
      ]
    );
    
    // Insert certificate needles and update inventory status
    if (needles && needles.length > 0) {
      for (const needle of needles) {
        // Add to certificate_needles
        await client.query(
          `INSERT INTO certificate_needles 
           (certificate_id, needle_type_id, serial_number, test_result)
           VALUES ($1, $2, $3, $4)`,
          [certificateId, needle.needle_type_id, needle.serial_number, needle.test_result || '']
        );
        
        // Update inventory status if the needle exists in inventory
        await client.query(
          `UPDATE needle_inventory 
           SET status = 'certified' 
           WHERE serial_number = $1`,
          [needle.serial_number]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      id: certificateId,
      certificate_number: certificateNumber,
      message: 'Certificate created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating certificate:', error);
    res.status(500).json({ error: 'Failed to create certificate' });
  } finally {
    client.release();
  }
});

// Update certificate
app.put('/api/certificates/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const {
      date,
      customer_id,
      reference_number,
      date_of_sale,
      order_number,
      destination_store,
      destination_address,
      inspector_id,
      needles,
      status
    } = req.body;
    
    await client.query('BEGIN');
    
    // Check if certificate exists
    const existingCert = await client.query('SELECT * FROM certificates WHERE id = $1', [id]);
    if (existingCert.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Update certificate
    await client.query(
      `UPDATE certificates 
       SET date = $1, customer_id = $2, reference_number = $3, date_of_sale = $4, 
       order_number = $5, destination_store = $6, destination_address = $7, 
       inspector_id = $8, status = $9
       WHERE id = $10`,
      [
        date,
        customer_id,
        reference_number,
        date_of_sale,
        order_number,
        destination_store,
        destination_address,
        inspector_id,
        status,
        id
      ]
    );
    
    // Get previous needles for this certificate
    const prevNeedlesResult = await client.query(
      'SELECT serial_number FROM certificate_needles WHERE certificate_id = $1',
      [id]
    );
    const prevNeedleSerials = prevNeedlesResult.rows.map(row => row.serial_number);
    
    // Get new needle serials from request
    const newNeedleSerials = needles ? needles.map(needle => needle.serial_number) : [];
    
    // Find needles that were removed (in previous but not in new)
    const removedNeedleSerials = prevNeedleSerials.filter(
      serial => !newNeedleSerials.includes(serial)
    );
    
    // Reset status of removed needles in inventory to 'available'
    for (const serial of removedNeedleSerials) {
      await client.query(
        `UPDATE needle_inventory SET status = 'available' WHERE serial_number = $1`,
        [serial]
      );
    }
    
    // Update needles (delete and re-insert)
    await client.query('DELETE FROM certificate_needles WHERE certificate_id = $1', [id]);
    
    if (needles && needles.length > 0) {
      for (const needle of needles) {
        // Add to certificate_needles
        await client.query(
          `INSERT INTO certificate_needles 
           (certificate_id, needle_type_id, serial_number, test_result)
           VALUES ($1, $2, $3, $4)`,
          [id, needle.needle_type_id, needle.serial_number, needle.test_result || '']
        );
        
        // Update inventory status to 'certified'
        await client.query(
          `UPDATE needle_inventory 
           SET status = 'certified' 
           WHERE serial_number = $1`,
          [needle.serial_number]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'Certificate updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update certificate' });
  } finally {
    client.release();
  }
});

// Handle certificate attachments
app.post('/api/certificates/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_path } = req.body;
    
    // Insert the attachment
    await pool.query(
      `INSERT INTO certificate_attachments (certificate_id, file_name, file_path)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [id, file_name, file_path]
    );
    
    res.status(201).json({ message: 'Attachment added successfully' });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
});

// Delete certificate attachment
app.delete('/api/attachments/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM certificate_attachments WHERE id = $1 RETURNING *',
      [attachmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Add needle to inventory
app.post('/api/needle-inventory', async (req, res) => {
  try {
    const { needle_type_id, serial_number } = req.body;
    
    if (!needle_type_id || !serial_number) {
      return res.status(400).json({ error: 'Needle type ID and serial number are required' });
    }
    
    // Check if needle type exists
    const typeResult = await pool.query('SELECT * FROM needle_types WHERE id = $1', [needle_type_id]);
    if (typeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Needle type not found' });
    }
    
    // Check if serial number already exists
    const serialResult = await pool.query('SELECT * FROM needle_inventory WHERE serial_number = $1', [serial_number]);
    if (serialResult.rows.length > 0) {
      return res.status(409).json({ error: 'Serial number already exists in inventory' });
    }
    
    // Add needle to inventory
    const result = await pool.query(
      `INSERT INTO needle_inventory (needle_type_id, serial_number, status)
       VALUES ($1, $2, 'available')
       RETURNING *`,
      [needle_type_id, serial_number]
    );
    
    // Get the needle type details for response
    const typeDetails = typeResult.rows[0];
    
    res.status(201).json({
      ...result.rows[0],
      name: typeDetails.name,
      specification: typeDetails.specification,
      message: 'Needle added to inventory successfully'
    });
  } catch (error) {
    console.error('Error adding needle to inventory:', error);
    res.status(500).json({ error: 'Failed to add needle to inventory' });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});