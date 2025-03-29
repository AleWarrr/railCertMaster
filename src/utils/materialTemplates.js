/**
 * Material templates for different railway materials
 * This provides predefined templates for different material types with their
 * expected test results, chemical compositions, and mechanical properties
 */

// Material types available in the system (simple strings para compatibilidad con el registro)
export const MATERIAL_TYPES = ['aguja', 'rail', 'sleeper', 'fastening', 'ballast', 'weld', 'insulation', 'joint', 'tie'];

// Original material types (mantenidos para referencia)
export const MATERIAL_TYPES_FULL = [
  { value: 'aguja', label: 'Agujas' },
  { value: 'rail', label: 'Rieles' },
  { value: 'sleeper', label: 'Traviesas' },
  { value: 'fastening', label: 'Sistemas de Sujeción' },
  { value: 'ballast', label: 'Balasto' },
  { value: 'weld', label: 'Soldaduras' },
  { value: 'insulation', label: 'Paneles de Aislamiento' },
  { value: 'joint', label: 'Juntas de Rieles' },
  { value: 'tie', label: 'Durmientes de Madera' }
];

// Obtener la etiqueta para un tipo de material
export const getMaterialLabel = (materialType) => {
  const material = MATERIAL_TYPES_FULL.find(m => m.value === materialType);
  return material ? material.label : materialType;
};

// Template for Needles
const needlesTemplate = {
  testResults: [
    { name: 'Verificación Dimensional', standardValue: 'Según plano', unit: 'mm' },
    { name: 'Prueba Ultrasónica', standardValue: 'Sin defectos internos', unit: '' },
    { name: 'Prueba de Partículas Magnéticas', standardValue: 'Sin defectos superficiales', unit: '' },
    { name: 'Inspección Visual', standardValue: 'Sin grietas visibles', unit: '' },
  ],
  chemicalComposition: [
    { name: 'Carbono (C)', minValue: '0.58', maxValue: '0.67', unit: '%' },
    { name: 'Manganeso (Mn)', minValue: '0.70', maxValue: '1.10', unit: '%' },
    { name: 'Silicio (Si)', minValue: '0.15', maxValue: '0.35', unit: '%' },
    { name: 'Fósforo (P)', minValue: '0', maxValue: '0.030', unit: '%' },
    { name: 'Azufre (S)', minValue: '0', maxValue: '0.030', unit: '%' },
    { name: 'Cromo (Cr)', minValue: '0.80', maxValue: '1.10', unit: '%' },
  ],
  mechanicalProperties: [
    { name: 'Resistencia a la Tracción', requiredValue: '≥ 900', unit: 'MPa' },
    { name: 'Límite Elástico', requiredValue: '≥ 600', unit: 'MPa' },
    { name: 'Elongación', requiredValue: '≥ 10', unit: '%' },
    { name: 'Dureza', requiredValue: '270-320', unit: 'BHN' },
    { name: 'Resistencia al Impacto', requiredValue: '≥ 20', unit: 'J' },
  ],
  // Specific properties for needle type certification
  needleWelds: [
    { id: '1', name: 'Tipo A - Soldadura Estándar', specification: 'RS-2023-A' },
    { id: '2', name: 'Tipo B - Soldadura Uso Pesado', specification: 'RS-2023-B' },
    { id: '3', name: 'Tipo C - Soldadura de Precisión', specification: 'RS-2023-C' },
    { id: '4', name: 'Tipo D - Soldadura Alta Resistencia', specification: 'RS-2023-D' },
    { id: '5', name: 'Tipo E - Soldadura Propósito Especial', specification: 'RS-2023-E' },
  ],
  inspectors: [
    { id: 'INS001', name: 'Juan Pérez', qualification: 'Inspector Principal' },
    { id: 'INS002', name: 'María García', qualification: 'Inspector Senior' },
    { id: 'INS003', name: 'Carlos Rodríguez', qualification: 'Especialista en Control de Calidad' },
  ],
  customers: [
    { id: 'CUST001', name: 'Ferrocarriles del Norte S.A.', address: 'Blvd. Norte 123, Ciudad Norte, CN 12345' },
    { id: 'CUST002', name: 'Autoridad de Tránsito del Sur', address: 'Av. Sur 456, Ciudad Sur, CS 67890' },
    { id: 'CUST003', name: 'Sistemas Ferroviarios del Este', address: 'Dr. Este 789, Pueblo Este, PE 23456' },
    { id: 'CUST004', name: 'Corporación Ferroviaria del Oeste', address: 'Calle Oeste 101, Ciudad Oeste, CO 78901' },
  ]
};

// Template for Rail Steel
const railTemplate = {
  testResults: [
    { name: 'Straightness Test', standardValue: '≤ 0.3mm/m', unit: 'mm' },
    { name: 'Surface Defect Inspection', standardValue: 'No visible cracks', unit: '' },
    { name: 'Ultrasonic Testing', standardValue: 'No internal defects', unit: '' },
    { name: 'Dimensional Check', standardValue: 'As per drawing', unit: 'mm' },
  ],
  chemicalComposition: [
    { name: 'Carbon (C)', minValue: '0.60', maxValue: '0.82', unit: '%' },
    { name: 'Manganese (Mn)', minValue: '0.70', maxValue: '1.25', unit: '%' },
    { name: 'Silicon (Si)', minValue: '0.15', maxValue: '0.40', unit: '%' },
    { name: 'Phosphorus (P)', minValue: '0', maxValue: '0.035', unit: '%' },
    { name: 'Sulfur (S)', minValue: '0', maxValue: '0.035', unit: '%' },
    { name: 'Chromium (Cr)', minValue: '0', maxValue: '0.30', unit: '%' },
  ],
  mechanicalProperties: [
    { name: 'Tensile Strength', requiredValue: '≥ 880', unit: 'MPa' },
    { name: 'Yield Strength', requiredValue: '≥ 500', unit: 'MPa' },
    { name: 'Elongation', requiredValue: '≥ 10', unit: '%' },
    { name: 'Hardness', requiredValue: '260-300', unit: 'BHN' },
  ],
};

// Template for Concrete Sleeper
const sleeperTemplate = {
  testResults: [
    { name: 'Compression Test', standardValue: '≥ 50 MPa', unit: 'MPa' },
    { name: 'Bending Test', standardValue: 'No cracks at design load', unit: 'kN' },
    { name: 'Dimensional Check', standardValue: 'As per drawing', unit: 'mm' },
    { name: 'Visual Inspection', standardValue: 'No visible defects', unit: '' },
  ],
  chemicalComposition: [
    { name: 'Cement Content', minValue: '350', maxValue: '450', unit: 'kg/m³' },
    { name: 'Water-Cement Ratio', minValue: '0.35', maxValue: '0.45', unit: '' },
  ],
  mechanicalProperties: [
    { name: 'Compressive Strength (28 days)', requiredValue: '≥ 50', unit: 'MPa' },
    { name: 'Flexural Strength', requiredValue: '≥ 5.5', unit: 'MPa' },
    { name: 'Rail Seat Static Load', requiredValue: '≥ 180', unit: 'kN' },
  ],
};

// Template for Fastening System
const fasteningTemplate = {
  testResults: [
    { name: 'Pull-out Test', standardValue: '≥ 15 kN', unit: 'kN' },
    { name: 'Fatigue Test', standardValue: '≥ 2 million cycles', unit: 'cycles' },
    { name: 'Corrosion Resistance Test', standardValue: '≥ 96 hours', unit: 'hours' },
    { name: 'Electrical Resistance Test', standardValue: '≥ 5 kΩ', unit: 'kΩ' },
  ],
  chemicalComposition: [
    { name: 'Carbon (C)', minValue: '0.40', maxValue: '0.45', unit: '%' },
    { name: 'Silicon (Si)', minValue: '0.15', maxValue: '0.35', unit: '%' },
    { name: 'Manganese (Mn)', minValue: '0.60', maxValue: '0.90', unit: '%' },
  ],
  mechanicalProperties: [
    { name: 'Tensile Strength', requiredValue: '≥ 800', unit: 'MPa' },
    { name: 'Yield Strength', requiredValue: '≥ 600', unit: 'MPa' },
    { name: 'Elastic Clip Toe Load', requiredValue: '≥ 10', unit: 'kN' },
  ],
};

// Template for Ballast Stone
const ballastTemplate = {
  testResults: [
    { name: 'Gradation Test', standardValue: 'As per specification', unit: '' },
    { name: 'Abrasion Test', standardValue: '≤ 25% loss', unit: '%' },
    { name: 'Water Absorption Test', standardValue: '≤ 2%', unit: '%' },
    { name: 'Flakiness Index', standardValue: '≤ 35%', unit: '%' },
    { name: 'Elongation Index', standardValue: '≤ 35%', unit: '%' },
  ],
  chemicalComposition: [
    { name: 'Silica Content', minValue: '45', maxValue: '60', unit: '%' },
    { name: 'Alumina Content', minValue: '10', maxValue: '20', unit: '%' },
  ],
  mechanicalProperties: [
    { name: 'Los Angeles Abrasion Value', requiredValue: '≤ 25', unit: '%' },
    { name: 'Aggregate Impact Value', requiredValue: '≤ 20', unit: '%' },
    { name: 'Aggregate Crushing Value', requiredValue: '≤ 22', unit: '%' },
  ],
};

// Template for Rail Weld
const weldTemplate = {
  testResults: [
    { name: 'Ultrasonic Testing', standardValue: 'No internal defects', unit: '' },
    { name: 'Radiographic Testing', standardValue: 'No defects > 2mm', unit: '' },
    { name: 'Hardness Test', standardValue: '240-320', unit: 'BHN' },
    { name: 'Straightness Test', standardValue: '≤ 0.3mm/m', unit: 'mm' },
    { name: 'Surface Finish', standardValue: 'Smooth transition', unit: '' },
  ],
  chemicalComposition: [],
  mechanicalProperties: [
    { name: 'Tensile Strength', requiredValue: '≥ 800', unit: 'MPa' },
    { name: 'Bend Test', requiredValue: 'No cracks', unit: '' },
    { name: 'Impact Strength', requiredValue: '≥ 15', unit: 'J' },
  ],
};

// Template for Insulation Panels
const insulationTemplate = {
  testResults: [
    { name: 'Electrical Resistance Test', standardValue: '≥ 10 MΩ', unit: 'MΩ' },
    { name: 'Water Absorption Test', standardValue: '≤ 0.5%', unit: '%' },
    { name: 'Flame Retardant Test', standardValue: 'Self-extinguishing', unit: '' },
    { name: 'Thermal Resistance Test', standardValue: '≥ 0.5 m²K/W', unit: 'm²K/W' },
  ],
  chemicalComposition: [],
  mechanicalProperties: [
    { name: 'Compressive Strength', requiredValue: '≥ 5', unit: 'MPa' },
    { name: 'Flexural Strength', requiredValue: '≥ 8', unit: 'MPa' },
    { name: 'Impact Resistance', requiredValue: '≥ 5', unit: 'kJ/m²' },
  ],
};

// Template for Rail Joint
const jointTemplate = {
  testResults: [
    { name: 'Dimensional Check', standardValue: 'As per drawing', unit: 'mm' },
    { name: 'Bolt Torque Test', standardValue: '≥ 200 Nm', unit: 'Nm' },
    { name: 'Surface Finish', standardValue: 'No visible defects', unit: '' },
    { name: 'Magnetic Particle Inspection', standardValue: 'No cracks', unit: '' },
  ],
  chemicalComposition: [
    { name: 'Carbon (C)', minValue: '0.35', maxValue: '0.50', unit: '%' },
    { name: 'Manganese (Mn)', minValue: '0.60', maxValue: '0.90', unit: '%' },
    { name: 'Silicon (Si)', minValue: '0.15', maxValue: '0.35', unit: '%' },
    { name: 'Phosphorus (P)', minValue: '0', maxValue: '0.04', unit: '%' },
    { name: 'Sulfur (S)', minValue: '0', maxValue: '0.04', unit: '%' },
  ],
  mechanicalProperties: [
    { name: 'Tensile Strength', requiredValue: '≥ 850', unit: 'MPa' },
    { name: 'Yield Strength', requiredValue: '≥ 520', unit: 'MPa' },
    { name: 'Elongation', requiredValue: '≥ 12', unit: '%' },
    { name: 'Fatigue Strength', requiredValue: '≥ 250', unit: 'MPa' },
  ],
};

// This section is for reference only and will be removed
// when we merge these values into the main needlesTemplate
/*
const extraNeedleData = {
  needleWelds: [
    { id: 'NW001', name: 'Needle Weld #1' },
    { id: 'NW002', name: 'Needle Weld #2' },
    { id: 'NW003', name: 'Needle Weld #3' },
    { id: 'NW004', name: 'Needle Weld #4' },
    { id: 'NW005', name: 'Needle Weld #5' },
    { id: 'NW006', name: 'Needle Weld #6' },
    { id: 'NW007', name: 'Needle Weld #7' },
    { id: 'NW008', name: 'Needle Weld #8' },
    { id: 'NW009', name: 'Needle Weld #9' },
    { id: 'NW010', name: 'Needle Weld #10' },
  ],
  inspectors: [
    { code: 'INS001', name: 'John Smith' },
    { code: 'INS002', name: 'Maria Garcia' },
    { code: 'INS003', name: 'David Johnson' },
    { code: 'INS004', name: 'Sarah Williams' },
  ],
  customers: [
    { id: 'CUST001', name: 'Northern Railways Inc.', address: '123 Northern Blvd, North City, NC 12345' },
    { id: 'CUST002', name: 'Southern Transit Authority', address: '456 Southern Ave, South City, SC 67890' },
    { id: 'CUST003', name: 'Eastern Rail Systems', address: '789 Eastern Dr, East Town, ET 23456' },
    { id: 'CUST004', name: 'Western Railway Corp', address: '101 Western St, West City, WC 78901' },
  ]
};
*/

// Template for Wooden Tie
const tieTemplate = {
  testResults: [
    { name: 'Moisture Content', standardValue: '10-15%', unit: '%' },
    { name: 'Treatment Retention', standardValue: '≥ 12 kg/m³', unit: 'kg/m³' },
    { name: 'Penetration Test', standardValue: '≥ 20mm', unit: 'mm' },
    { name: 'Dimensional Check', standardValue: 'As per specification', unit: 'mm' },
  ],
  chemicalComposition: [],
  mechanicalProperties: [
    { name: 'Compression Strength (Parallel to Grain)', requiredValue: '≥ 35', unit: 'MPa' },
    { name: 'Modulus of Rupture', requiredValue: '≥ 70', unit: 'MPa' },
    { name: 'Hardness', requiredValue: '≥ 4000', unit: 'N' },
    { name: 'Modulus of Elasticity', requiredValue: '≥ 10', unit: 'GPa' },
  ],
};

// Define mapping of material types to their templates
const MATERIAL_TEMPLATES = {
  aguja: needlesTemplate,
  rail: railTemplate,
  sleeper: sleeperTemplate,
  fastening: fasteningTemplate,
  ballast: ballastTemplate,
  weld: weldTemplate,
  insulation: insulationTemplate,
  joint: jointTemplate,
  tie: tieTemplate
};

/**
 * Get the template for a specific material type
 * @param {string} materialType - The type of material
 * @returns {Object|null} The template for the material type, or null if not found
 */
export const getMaterialTemplate = (materialType) => {
  return MATERIAL_TEMPLATES[materialType] || null;
};
