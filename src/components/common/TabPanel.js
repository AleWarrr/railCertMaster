import React from 'react';
import { Box } from '@mui/material';

/**
 * Componente para manejar paneles de pestañas
 * @param {Object} props - Propiedades del componente
 * @param {ReactNode} props.children - Contenido del panel
 * @param {number} props.value - Valor de la pestaña activa
 * @param {number} props.index - Índice de este panel
 */
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`certificado-tabpanel-${index}`}
      aria-labelledby={`certificado-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default TabPanel; 