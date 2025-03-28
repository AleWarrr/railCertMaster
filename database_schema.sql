-- Esquema de base de datos para RailCertMaster

-- Tabla de inspectores
CREATE TABLE IF NOT EXISTS inspectores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_inspector TEXT UNIQUE,
    nombre TEXT NOT NULL,
    email TEXT,
    logo_sello BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tipos de materiales
CREATE TABLE IF NOT EXISTS tipos_materiales (
    id_tipo_material INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de fabricantes
CREATE TABLE IF NOT EXISTS fabricantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    contacto TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    nif TEXT UNIQUE,
    responsable_calidad TEXT,
    email_responsable_calidad TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación fabricante-cliente
CREATE TABLE IF NOT EXISTS relacion_fabricante_cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fabricante_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    UNIQUE(fabricante_id, cliente_id)
);

-- Tabla de PDFs
CREATE TABLE IF NOT EXISTS pdfs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_tipo_pdf TEXT NOT NULL,
    pdf_blob BLOB,
    nombre_pdf TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de designaciones
CREATE TABLE IF NOT EXISTS designaciones (
    id_designacion INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula TEXT NOT NULL,
    descripcion TEXT,
    tipo_material_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_material_id) REFERENCES tipos_materiales(id_tipo_material)
);

-- Tabla de certificados
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
);

-- Tabla de agujas
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
);

-- Tabla de relación certificado-agujas
CREATE TABLE IF NOT EXISTS relacion_certificado_agujas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    certificado_id INTEGER NOT NULL,
    aguja_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (certificado_id) REFERENCES certificados(id) ON DELETE CASCADE,
    FOREIGN KEY (aguja_id) REFERENCES agujas(id) ON DELETE CASCADE,
    UNIQUE(certificado_id, aguja_id)
);

-- Insertar datos de ejemplo para tipos de materiales
INSERT INTO tipos_materiales (nombre, descripcion) VALUES 
    ('Agujas', 'Agujas ferroviarias de distintos tipos'),
    ('Juntas', 'Juntas para vías ferroviarias'),
    ('Carriles', 'Carriles para vías ferroviarias'),
    ('Tirafondos', 'Tornillos especiales para fijar los carriles a las traviesas'),
    ('Traviesas', 'Elementos transversales que soportan los carriles')
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo para fabricantes
INSERT INTO fabricantes (nombre, ubicacion, contacto, email) VALUES 
    ('Talleres Alegría', 'Asturias, España', 'Carlos Fernández', 'info@talleresalegria.com'),
    ('JEZ Sistemas Ferroviarios', 'País Vasco, España', 'María López', 'contacto@jez.es'),
    ('AMURRIO Ferrocarril', 'Álava, España', 'Juan Rodríguez', 'contacto@amurrio.es'),
    ('Vossloh España', 'Valencia, España', 'Pedro Martínez', 'info@vossloh.es'),
    ('ArcelorMittal Rails', 'Madrid, España', 'Elena García', 'rails@arcelormittal.com')
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo para clientes
INSERT INTO clientes (nombre, ubicacion, nif, responsable_calidad, email_responsable_calidad) VALUES 
    ('Ferrovial S.A.', 'Madrid, España', 'A-12345678', 'Ana Martínez', 'ana.martinez@ferrovial.com'),
    ('Adif', 'Barcelona, España', 'B-87654321', 'Carlos Rodríguez', 'carlos.rodriguez@adif.es'),
    ('Renfe Operadora', 'Sevilla, España', 'C-23456789', 'Laura Sánchez', 'laura.sanchez@renfe.es'),
    ('Construcciones Ferroviarias S.L.', 'Valencia, España', 'D-34567890', 'Miguel González', 'miguel.gonzalez@consferrov.es'),
    ('Talgo', 'Bilbao, España', 'E-45678901', 'Elena López', 'elena.lopez@talgo.com')
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo para inspectores
INSERT INTO inspectores (codigo_inspector, nombre, email) VALUES 
    ('INSP-001', 'Juan Gómez', 'juan.gomez@railcert.es'),
    ('INSP-002', 'María Fernández', 'maria.fernandez@railcert.es'),
    ('INSP-003', 'Antonio Pérez', 'antonio.perez@railcert.es'),
    ('INSP-004', 'Carmen Díaz', 'carmen.diaz@railcert.es'),
    ('INSP-005', 'Roberto Álvarez', 'roberto.alvarez@railcert.es')
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo para relaciones fabricante-cliente
INSERT INTO relacion_fabricante_cliente (fabricante_id, cliente_id) 
SELECT f.id, c.id FROM fabricantes f, clientes c 
WHERE f.nombre = 'Talleres Alegría' AND c.nombre = 'Adif'
ON CONFLICT DO NOTHING;

INSERT INTO relacion_fabricante_cliente (fabricante_id, cliente_id) 
SELECT f.id, c.id FROM fabricantes f, clientes c 
WHERE f.nombre = 'JEZ Sistemas Ferroviarios' AND c.nombre = 'Renfe Operadora'
ON CONFLICT DO NOTHING;

INSERT INTO relacion_fabricante_cliente (fabricante_id, cliente_id) 
SELECT f.id, c.id FROM fabricantes f, clientes c 
WHERE f.nombre = 'AMURRIO Ferrocarril' AND c.nombre = 'Ferrovial S.A.'
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo para designaciones
INSERT INTO designaciones (matricula, descripcion, tipo_material_id) 
SELECT 'DSA-54', 'Desvío simple tipo A - UIC 54', tm.id_tipo_material 
FROM tipos_materiales tm WHERE tm.nombre = 'Agujas'
ON CONFLICT DO NOTHING;

INSERT INTO designaciones (matricula, descripcion, tipo_material_id) 
SELECT 'DSB-60', 'Desvío simple tipo B - UIC 60', tm.id_tipo_material 
FROM tipos_materiales tm WHERE tm.nombre = 'Agujas'
ON CONFLICT DO NOTHING;

INSERT INTO designaciones (matricula, descripcion, tipo_material_id) 
SELECT 'TG-54', 'Travesía con uniones - UIC 54', tm.id_tipo_material 
FROM tipos_materiales tm WHERE tm.nombre = 'Agujas'
ON CONFLICT DO NOTHING;
