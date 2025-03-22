/**
 * Material templates for different railway materials
 * This provides predefined templates for different material types with their
 * expected test results, chemical compositions, and mechanical properties
 */

// Material types available in the system
export const MATERIAL_TYPES = [
  { value: 'rail', label: 'Rail Steel' },
  { value: 'sleeper', label: 'Concrete Sleeper' },
  { value: 'fastening', label: 'Fastening System' },
  { value: 'ballast', label: 'Ballast Stone' },
  { value: 'weld', label: 'Rail Weld' },
  { value: 'insulation', label: 'Insulation Panels' },
  { value: 'joint', label: 'Rail Joint' },
  { value: 'tie', label: 'Wooden Tie' },
];

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

// Map material types to their templates
const MATERIAL_TEMPLATES = {
  rail: railTemplate,
  sleeper: sleeperTemplate,
  fastening: fasteningTemplate,
  ballast: ballastTemplate,
  weld: weldTemplate,
  insulation: insulationTemplate,
  joint: jointTemplate,
  tie: tieTemplate,
};

/**
 * Get the template for a specific material type
 * @param {string} materialType - The type of material
 * @returns {Object|null} The template for the material type, or null if not found
 */
export const getMaterialTemplate = (materialType) => {
  return MATERIAL_TEMPLATES[materialType] || null;
};
