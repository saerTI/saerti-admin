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
  
  // ✅ CORREGIDO: Hacer estos campos opcionales porque pueden no estar presentes
  employeeName?: string;        // Cambié de 'string' a 'string?' - Puede ser undefined si hay problemas de mapeo
  employeeRut?: string;         // Ya era opcional - correcto
  employeePosition?: string;    // Ya era opcional - correcto
  
  area?: string;                // Ya era opcional - correcto
  period: string;
  workDays: number;
  sueldoLiquido?: number;       // Ya era opcional - correcto
  anticipo?: number;            // Ya era opcional - correcto
  paymentMethod: string;
  
  // ✅ CORREGIDO: Hacer este campo opcional porque puede no estar presente
  projectCode?: string;         // Cambié de 'string' a 'string?' - Los centros de costo pueden no existir
  
  paymentDate?: string;         // Ya era opcional - correcto
  notes?: string;               // Ya era opcional - correcto
}

// ✅ También voy a agregar algunos campos opcionales que podrían ser útiles
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
  
  // Campos de centro de costo
  centroCosto?: string;
  centroCostoNombre?: string;
  area?: string;
  
  // Campo para el monto total calculado
  montoTotal?: number;
  
  // Campo para ID de empleado si está disponible
  employee_id?: number;
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

// ✅ MEJORADO: Agregar campos de filtro que faltaban
export interface RemuneracionFilter {
  state?: string;
  employeePosition?: string;
  projectId?: string;
  period?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
  
  // ✅ Nuevos filtros que tu hook usa pero no estaban tipados
  area?: string;           // Para filtrar por área
  type?: string;           // Para filtrar por tipo (REMUNERACION/ANTICIPO)
  rut?: string;            // Para filtrar por RUT
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