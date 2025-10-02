// src/services/CC/index.ts
import remuneracionesService from './remuneracionesService';
import { Remuneracion, RemuneracionFilter, RemuneracionCreateData, RemuneracionUpdateData } from '../../types/CC/remuneracion';

import { previsionalesService } from './previsionalesService';
import { Previsional, PrevisionalImportItem, NewPrevisionalData, UpdatePrevisionalData } from '../../types/CC/previsional';

import empleadosService from './empleadosService';

import {
  getFixedCosts,
  getFixedCostById,
  createFixedCost,
  updateFixedCost,
  deleteFixedCost,
  updatePaidQuotas,
  getFixedCostsStats
} from './fixedCostsService';

import ordenesCompraItemService, { purchaseOrderItemsService } from './ordenesCompraItemService';

import ordenesCompraService, { createOrdenesCompraBatch } from './ordenesCompraService';

import {
  parseFechaChilena,
  parseMontoChileno,
  extraerItemsDesdeCSV,
  OrdenCompraItemCreateWithOrderNumber
} from './parseItemsFromCsv';

// Exportar servicios
export {
  remuneracionesService,
  previsionalesService,
  empleadosService,
  getFixedCosts,
  getFixedCostById,
  createFixedCost,
  updateFixedCost,
  deleteFixedCost,
  updatePaidQuotas,
  getFixedCostsStats,
  ordenesCompraItemService,
  purchaseOrderItemsService,
  ordenesCompraService,
  createOrdenesCompraBatch,
  parseFechaChilena,
  parseMontoChileno,
  extraerItemsDesdeCSV
};

// Exportar tipos
export type {
  Remuneracion,
  RemuneracionFilter,
  RemuneracionCreateData,
  RemuneracionUpdateData,
  Previsional,
  NewPrevisionalData,
  UpdatePrevisionalData,
  OrdenCompraItemCreateWithOrderNumber
};

// Exportación por defecto para uso con import * as CCServices from './CC'
export default {
  remuneracionesService,
  previsionalesService,
  empleadosService,
  fixedCostsService: {
    getFixedCosts,
    getFixedCostById,
    createFixedCost,
    updateFixedCost,
    deleteFixedCost,
    updatePaidQuotas,
    getFixedCostsStats
  },
  ordenesCompraItemService,
  purchaseOrderItemsService,
  ordenesCompraService,
  createOrdenesCompraBatch,
  parseItemsFromCsv: {
    parseFechaChilena,
    parseMontoChileno,
    extraerItemsDesdeCSV
  }
};