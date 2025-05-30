// src/types/CC/remuneracion.ts
import { Project } from "../project";

export interface Remuneracion {
  id: number;
  name: string;
  date: string;
  amount: number;
  state: string;
  companyId: number;
  projectId?: number;
  projectName?: string;
  employeeId: number;
  employeeName: string;
  employeeRut?: string;
  employeePosition?: string;
  area?: string;
  period: string;
  workDays: number;
  sueldoLiquido?: number;
  anticipo?: number;
  paymentMethod: string;
  projectCode: string;
  paymentDate?: string;
  notes?: string;
}

export interface RemuneracionCreateData {
  rut: string;
  nombre: string;
  lastName?: string;
  tipo: 'REMUNERACION' | 'ANTICIPO';
  sueldoLiquido?: number;
  anticipo?: number;
  proyectoId: string;
  fecha: string;
  estado?: string;
  cargo?: string;
  diasTrabajados?: number;
  metodoPago?: string;
  // Nuevos campos
  centroCosto?: string;
  centroCostoNombre?: string;
  area?: string;
  // Campo para el monto total
  montoTotal?: number;
}

export interface RemuneracionUpdateData {
  rut?: string;
  nombre?: string;
  tipo?: 'REMUNERACION' | 'ANTICIPO';
  sueldoLiquido?: number;
  anticipo?: number;
  proyectoId?: string;
  fecha?: string;
  estado?: string;
  cargo?: string;
  diasTrabajados?: number;
  metodoPago?: string;
}

export interface RemuneracionFilter {
  state?: string;
  employeePosition?: string;
  projectId?: string;
  period?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

// This is the shape of the API response for lists of remuneraciones
export interface RemuneracionesResponse {
  success: boolean;
  data: Remuneracion[];
  message: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}