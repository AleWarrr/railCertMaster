/**
 * Interfaz que deben implementar todos los formularios de materiales
 * 
 * Esta interfaz define los métodos que cada formulario específico de material
 * debe implementar para integrarse correctamente con el sistema.
 */
export const MaterialFormInterface = {
  /**
   * Renderiza el formulario específico para este material
   * @param {Object} props - Propiedades necesarias para renderizar el formulario
   * @returns {JSX.Element} El formulario renderizado
   */
  renderForm: (props) => {},
  
  /**
   * Valida los datos del formulario para este material
   * @param {Object} data - Datos a validar
   * @returns {Object} Objeto con errores, vacío si no hay errores
   */
  validate: (data) => ({}),
  
  /**
   * Obtiene los valores por defecto para este material
   * @returns {Object} Valores por defecto
   */
  getDefaultValues: () => ({}),
  
  /**
   * Obtiene la lista de archivos adjuntos requeridos para este material
   * @returns {Array<string>} Lista de tipos de archivos adjuntos
   */
  getRequiredAttachments: () => ([]),
  
  /**
   * Genera un número de certificado para este material
   * @returns {string} Número de certificado generado
   */
  generateCertificateNumber: () => "",
  
  /**
   * Procesa los datos antes de guardarlos
   * @param {Object} data - Datos a procesar
   * @returns {Object} Datos procesados
   */
  processDataBeforeSave: (data) => data
};

/**
 * Crea un formulario de material con los valores predeterminados
 * mezclados con una implementación parcial.
 * 
 * @param {Object} implementation - Implementación parcial del formulario
 * @returns {Object} Formulario completo con valores predeterminados para métodos no implementados
 */
export const createMaterialForm = (implementation) => {
  return {
    ...MaterialFormInterface,
    ...implementation
  };
}; 