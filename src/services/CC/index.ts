// src/services/CC/index.ts
import remuneracionesService, { 
  Remuneracion, 
  RemuneracionFilter, 
  RemuneracionCreateData, 
  RemuneracionUpdateData 
} from './remuneracionesService';

import previsionalesService, { 
  Previsional, 
  PrevisionalFilter, 
  PrevisionalCreateData, 
  PrevisionalUpdateData 
} from './previsionalesService';

// Exportar servicios
export {
  remuneracionesService,
  previsionalesService
};

// Exportar tipos
export type {
  Remuneracion,
  RemuneracionFilter,
  RemuneracionCreateData,
  RemuneracionUpdateData,
  Previsional,
  PrevisionalFilter,
  PrevisionalCreateData,
  PrevisionalUpdateData
};

// Exportación por defecto para uso con import * as CCServices from './CC'
export default {
  remuneracionesService,
  previsionalesService
};