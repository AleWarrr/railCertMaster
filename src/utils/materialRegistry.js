/**
 * Sistema de registro de materiales
 * Permite registrar implementaciones específicas para cada tipo de material
 * y recuperarlas cuando sea necesario.
 */

// Registro de materiales donde almacenaremos las implementaciones
const materialRegistry = {};

/**
 * Registra una implementación para un tipo de material
 * 
 * @param {string} type - Tipo de material (ej: 'aguja', 'rail', 'sleeper')
 * @param {Object} implementation - Implementación del formulario para este material
 */
export const registerMaterial = (type, implementation) => {
  materialRegistry[type] = implementation;
};

/**
 * Obtiene la implementación para un tipo de material específico
 * 
 * @param {string} type - Tipo de material a buscar
 * @returns {Object} La implementación del formulario para ese material
 * @throws {Error} Si el tipo de material no está registrado
 */
export const getMaterialForm = (type) => {
  if (!materialRegistry[type]) {
    throw new Error(`Tipo de material "${type}" no registrado`);
  }
  return materialRegistry[type];
};

/**
 * Verifica si un tipo de material está registrado
 * 
 * @param {string} type - Tipo de material a verificar
 * @returns {boolean} True si el material está registrado
 */
export const hasMaterialForm = (type) => {
  return !!materialRegistry[type];
};

/**
 * Obtiene todos los tipos de materiales registrados
 * 
 * @returns {Array<string>} Array con los tipos de materiales registrados
 */
export const getRegisteredMaterialTypes = () => {
  return Object.keys(materialRegistry);
}; 