/**
 * Archivo de inicialización para registrar todos los tipos de materiales
 * 
 * Este archivo debe ser importado en la aplicación para asegurar que
 * todos los materiales se registren correctamente antes de ser usados.
 */

// Importar todas las implementaciones de materiales
import '../components/materials/NeedleForm';

// Podemos agregar más importaciones de otros materiales a medida que los implementemos
// import '../components/materials/RailForm';
// import '../components/materials/SleeperForm';

/**
 * Función para inicializar todos los registros de materiales
 * Esta función no hace nada explícitamente porque la importación
 * de los archivos de arriba ya registra los materiales
 */
export const initializeMaterials = () => {
  console.log('Materiales inicializados');
};

export default initializeMaterials; 