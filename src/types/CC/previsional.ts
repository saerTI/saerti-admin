// src/types/CC/previsional.ts
import { Project } from "../project";

export interface Previsional {
  id: number;
  name: string;
  date: string;
  amount: number;
  state: string;
  companyId: number;
  projectId?: number;
  projectName?: string;
  projectCode?: string;
  employeeId: number;
  employeeName: string;
  employeeRut?: string;
  type: string; // AFP, Isapre, Seguro Cesantía, etc.
  period: string;
  area?: string;
  centroCosto?: string;
  centroCostoNombre?: string;
  descuentosLegales?: number; // Campo para el total de descuentos legales
  paymentDate?: string;
  notes?: string;
}

export interface PrevisionalCreateData {
  rut: string;
  nombre: string;
  tipo: 'AFP' | 'Isapre' | 'Isapre 7%' | 'Seguro Cesantía' | 'Mutual'; // Valores específicos en lugar de string genérico
  monto: number;
  proyectoId: string;
  fecha: string; // Período en formato MM/YYYY
  area?: string;
  centroCosto?: string;
  estado?: string;
  notas?: string;
}

export interface PrevisionalUpdateData {
  rut?: string;
  nombre?: string;
  tipo?: string;
  monto?: number;
  proyectoId?: string;
  fecha?: string;
  area?: string;
  centroCosto?: string;
  estado?: string;
  notas?: string;
}

export interface PrevisionalFilter {
  state?: string;
  category?: string; // Para el tipo de previsional (AFP, Isapre, etc.)
  projectId?: number | string;
  period?: string[];
  area?: string;
  centro_costo?: string;
  startDate?: string;
  endDate?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

// This is the shape of the API response for lists of previsionales
export interface PrevisionalesResponse {
  success: boolean;
  data: Previsional[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}