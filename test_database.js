const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Configurar la base de datos
const dbPath = path.join(__dirname, 'railcertmaster.db');
const db = new sqlite3.Database(dbPath);

// Función auxiliar para ejecutar consultas
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error de base de datos:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Función auxiliar para ejecutar una sentencia SQL
const run = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        console.error('Error de base de datos:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Función para crear un certificado de prueba con agujas
const crearCertificadoConAgujas = async () => {
  try {
    console.log('Iniciando creación de certificado de prueba con agujas...');

    // 1. Verificar que tenemos los datos necesarios
    const fabricantes = await runQuery('SELECT * FROM fabricantes LIMIT 1');
    if (!fabricantes.length) {
      throw new Error('No hay fabricantes en la base de datos.');
    }

    const clientes = await runQuery('SELECT * FROM clientes LIMIT 1');
    if (!clientes.length) {
      throw new Error('No hay clientes en la base de datos.');
    }

    const tiposMateriales = await runQuery("SELECT * FROM tipos_materiales WHERE nombre = 'Agujas'");
    if (!tiposMateriales.length) {
      throw new Error('No hay tipo de material "Agujas" en la base de datos.');
    }

    const inspectores = await runQuery('SELECT * FROM inspectores LIMIT 1');
    if (!inspectores.length) {
      throw new Error('No hay inspectores en la base de datos.');
    }

    const designaciones = await runQuery('SELECT * FROM designaciones LIMIT 1');
    if (!designaciones.length) {
      throw new Error('No hay designaciones en la base de datos.');
    }

    // 2. Crear un PDF de certificado (simulado)
    const pdfSamplePath = path.join(__dirname, 'sample_test.pdf');
    let pdfBlob = null;
    
    // Si no existe el archivo de muestra, crear un PDF vacío para la prueba
    if (!fs.existsSync(pdfSamplePath)) {
      const emptyPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000056 00000 n\n0000000111 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n195\n%%EOF', 'utf-8');
      fs.writeFileSync(pdfSamplePath, emptyPdfBuffer);
      pdfBlob = emptyPdfBuffer;
    } else {
      pdfBlob = fs.readFileSync(pdfSamplePath);
    }

    // 3. Almacenar el PDF en la base de datos
    const pdfResult = await run(
      'INSERT INTO pdfs (codigo_tipo_pdf, pdf_blob, nombre_pdf) VALUES (?, ?, ?)',
      ['CERT', pdfBlob, 'certificado_prueba.pdf']
    );
    const pdfId = pdfResult.id;
    console.log(`PDF almacenado con ID: ${pdfId}`);

    // 4. Crear el certificado
    const certificadoResult = await run(
      `INSERT INTO certificados 
       (numero_certificado, fecha, fabricante_id, cliente_id, pedido_interno, 
       tipo_material_id, codigo_inspector, id_pdf_certificado, firmado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'TEST-2024-001', 
        new Date().toISOString().split('T')[0], // fecha actual
        fabricantes[0].id,
        clientes[0].id,
        'PI-TEST-2024',
        tiposMateriales[0].id_tipo_material,
        inspectores[0].id,
        pdfId,
        0 // no firmado
      ]
    );
    const certificadoId = certificadoResult.id;
    console.log(`Certificado creado con ID: ${certificadoId}`);

    // 5. Crear PDFs para agujas
    const pdfDurezaResult = await run(
      'INSERT INTO pdfs (codigo_tipo_pdf, pdf_blob, nombre_pdf) VALUES (?, ?, ?)',
      ['DUREZA', pdfBlob, 'dureza_prueba.pdf']
    );
    const pdfDurezaId = pdfDurezaResult.id;

    const pdfEnsayoResult = await run(
      'INSERT INTO pdfs (codigo_tipo_pdf, pdf_blob, nombre_pdf) VALUES (?, ?, ?)',
      ['PART', pdfBlob, 'ensayo_particulas_prueba.pdf']
    );
    const pdfEnsayoId = pdfEnsayoResult.id;

    const pdfPlanillaResult = await run(
      'INSERT INTO pdfs (codigo_tipo_pdf, pdf_blob, nombre_pdf) VALUES (?, ?, ?)',
      ['PLAN', pdfBlob, 'planilla_prueba.pdf']
    );
    const pdfPlanillaId = pdfPlanillaResult.id;

    const pdfMedicionResult = await run(
      'INSERT INTO pdfs (codigo_tipo_pdf, pdf_blob, nombre_pdf) VALUES (?, ?, ?)',
      ['MED', pdfBlob, 'medicion_prueba.pdf']
    );
    const pdfMedicionId = pdfMedicionResult.id;

    // 6. Crear tres agujas y asignarlas al certificado
    for (let i = 1; i <= 3; i++) {
      const numeroAguja = `TEST-AG-${i.toString().padStart(3, '0')}`;
      
      const agujaResult = await run(
        `INSERT INTO agujas 
         (num_aguja, fabricante_id, colada, certificado_id, cliente_id, 
         pdf_dureza, pdf_ensayo_particulas, pdf_planilla, pdf_medicion, 
         designacion_id, firmado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numeroAguja,
          fabricantes[0].id,
          `COL-TEST-${i}`,
          certificadoId,
          clientes[0].id,
          pdfDurezaId,
          pdfEnsayoId,
          pdfPlanillaId,
          pdfMedicionId,
          designaciones[0].id_designacion,
          0 // no firmado
        ]
      );
      const agujaId = agujaResult.id;
      
      // Crear la relación entre certificado y aguja
      await run(
        'INSERT INTO relacion_certificado_agujas (certificado_id, aguja_id) VALUES (?, ?)',
        [certificadoId, agujaId]
      );
      
      console.log(`Aguja ${numeroAguja} creada con ID: ${agujaId} y asociada al certificado`);
    }

    console.log('\nDatos creados correctamente. Verificando datos...\n');

    // 7. Verificar los datos creados
    const certificado = await runQuery(`
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
    `, [certificadoId]);

    console.log('Certificado creado:');
    console.log(JSON.stringify(certificado[0], null, 2));

    const agujas = await runQuery(`
      SELECT 
        a.*,
        f.nombre as fabricante_nombre,
        cl.nombre as cliente_nombre,
        d.matricula as designacion_matricula
      FROM agujas a
      LEFT JOIN fabricantes f ON a.fabricante_id = f.id
      LEFT JOIN clientes cl ON a.cliente_id = cl.id
      LEFT JOIN designaciones d ON a.designacion_id = d.id_designacion
      WHERE a.certificado_id = ?
    `, [certificadoId]);

    console.log('\nAgujas asociadas al certificado:');
    console.log(JSON.stringify(agujas, null, 2));

    const relaciones = await runQuery(`
      SELECT * FROM relacion_certificado_agujas WHERE certificado_id = ?
    `, [certificadoId]);

    console.log('\nRelaciones entre certificado y agujas:');
    console.log(JSON.stringify(relaciones, null, 2));

    console.log('\nPrueba completada con éxito.');

  } catch (error) {
    console.error('Error al crear certificado de prueba:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    db.close();
  }
};

// Ejecutar el script de prueba
crearCertificadoConAgujas(); 