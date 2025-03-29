import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/api';

// Crear contexto de autenticación
const AuthContext = createContext();

/**
 * Proveedor de contexto de autenticación
 * Proporciona información sobre el usuario actual a toda la aplicación
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cargar el usuario al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error al cargar el usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Determinar el rol del usuario
  const userRole = user?.role || 'guest';
  const isManufacturer = userRole === 'manufacturer' || userRole === 'admin';
  const isReceiver = userRole === 'receiver' || userRole === 'admin';
  const isInspector = userRole === 'inspector' || userRole === 'admin';
  const isAdmin = userRole === 'admin';
  
  // Valor del contexto que se proveerá a los componentes
  const value = {
    user,
    loading,
    userRole,
    isManufacturer,
    isReceiver,
    isInspector,
    isAdmin,
    // Método para actualizar el usuario
    updateUser: (userData) => {
      setUser(userData);
    },
    // Método para cerrar sesión
    logout: () => {
      setUser(null);
    }
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 * @returns {Object} El contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 