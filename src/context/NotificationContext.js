import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Función ficticia para obtener notificaciones
// Esto debería implementarse en utils/api.js en un entorno real
const getNotifications = async (userId, userRole) => {
  // Simulación de llamada a API
  console.log(`Obteniendo notificaciones para usuario ${userId} con rol ${userRole}`);
  return {
    success: true,
    data: [
      // Notificaciones de ejemplo
    ]
  };
};

// Crear contexto de notificaciones
const NotificationContext = createContext();

/**
 * Proveedor de contexto de notificaciones
 * Gestiona el sistema de notificaciones y buzón para la aplicación
 */
export const NotificationProvider = ({ children }) => {
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cargar notificaciones cuando el usuario cambia
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await getNotifications(user.id, userRole);
        if (response.success) {
          setNotifications(response.data || []);
        } else {
          console.error('Error al obtener notificaciones:', response.error);
        }
      } catch (error) {
        console.error('Error al obtener notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Configurar un intervalo para actualizar las notificaciones cada minuto
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user, userRole]);
  
  /**
   * Marca una notificación como leída
   * @param {string} notificationId - ID de la notificación
   */
  const markAsRead = async (notificationId) => {
    try {
      // Aquí iría la llamada a la API
      
      // Actualizar localmente
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      );
      
      setNotifications(updatedNotifications);
      
      return { success: true };
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Aprueba una solicitud de certificado
   * @param {string} certificateId - ID del certificado
   * @param {Object} approvalData - Datos adicionales para la aprobación
   */
  const approveCertificate = async (certificateId, approvalData = {}) => {
    try {
      // Aquí iría la llamada a la API
      
      // Actualizar localmente (eliminar de las notificaciones o marcar como aprobado)
      const updatedNotifications = notifications.filter(
        notification => notification.certificateId !== certificateId
      );
      
      setNotifications(updatedNotifications);
      
      return { success: true };
    } catch (error) {
      console.error('Error al aprobar certificado:', error);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Rechaza una solicitud de certificado
   * @param {string} certificateId - ID del certificado
   * @param {string} reason - Motivo del rechazo
   */
  const rejectCertificate = async (certificateId, reason) => {
    try {
      // Aquí iría la llamada a la API
      
      // Actualizar localmente
      const updatedNotifications = notifications.filter(
        notification => notification.certificateId !== certificateId
      );
      
      setNotifications(updatedNotifications);
      
      return { success: true };
    } catch (error) {
      console.error('Error al rechazar certificado:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Calcular el número de notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Valor del contexto
  const value = {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    approveCertificate,
    rejectCertificate
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook para usar el contexto de notificaciones
 * @returns {Object} El contexto de notificaciones
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
  }
  return context;
}; 