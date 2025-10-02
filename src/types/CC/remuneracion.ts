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

// ✅ ACTUALIZADO: Tipos para trabajar con la nueva estructura de payroll
export interface RemuneracionCreateData {
  employee_id: number;
  type: 'remuneracion' | 'anticipo' | 'REMUNERACION' | 'ANTICIPO';
  amount: number;
  net_salary?: number;
  advance_payment?: number;
  date: string;
  month_period?: number;
  year_period?: number;
  work_days?: number;
  payment_method?: 'transferencia' | 'cheque' | 'efectivo';
  status?: 'pendiente' | 'aprobado' | 'pagado' | 'rechazado' | 'cancelado';
  payment_date?: string;
  notes?: string;
  
  // Campos legacy para compatibilidad
  periodo?: string;
  rut?: string;
  nombre?: string;
  tipo?: 'REMUNERACION' | 'ANTICIPO';
  sueldoLiquido?: number;
  anticipo?: number;
  fecha?: string;
  estado?: string;
  cargo?: string;
  diasTrabajados?: number;
  metodoPago?: string;
  montoTotal?: number;
}

export interface RemuneracionUpdateData {
  employee_id?: number;
  type?: 'remuneracion' | 'anticipo' | 'REMUNERACION' | 'ANTICIPO';
  amount?: number;
  net_salary?: number;
  advance_payment?: number;
  date?: string;
  month_period?: number;
  year_period?: number;
  work_days?: number;
  payment_method?: 'transferencia' | 'cheque' | 'efectivo';
  status?: 'pendiente' | 'aprobado' | 'pagado' | 'rechazado' | 'cancelado';
  payment_date?: string;
  notes?: string;
  
  // Campos legacy para compatibilidad
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

// ✅ ACTUALIZADO: Nuevos filtros para la estructura payroll
export interface RemuneracionFilter {
  state?: string;
  search?: string;
  type?: string;
  rut?: string;
  period?: string[]; // Legacy support
  
  // Nuevos filtros para la estructura payroll
  employeeId?: number;
  month?: number;
  year?: number;
  
  // Filtros legacy que se mantienen para compatibilidad
  employeePosition?: string;
  projectId?: string;
  date_from?: string;
  date_to?: string;
  area?: string;
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