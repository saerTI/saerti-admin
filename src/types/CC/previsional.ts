export type PrevisionalType = 'afp' | 'isapre' | 'isapre_7' | 'fonasa' | 'seguro_cesantia' | 'mutual';
export type PrevisionalStatus = 'pendiente' | 'pagado' | 'cancelado';

export interface Previsional {
  id: number;
  employee_id: number;
  cost_center_id: number;
  type: PrevisionalType;
  amount: number;
  date: string; // Formato YYYY-MM-DD
  month_period: number;
  year_period: number;
  status: PrevisionalStatus;
  payment_date?: string | null; // Formato YYYY-MM-DD
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // Campos de las tablas relacionadas (unidos en la consulta)
  employee_name?: string;
  employee_rut?: string;
  cost_center_name?: string;
}

// Tipo para crear un nuevo registro (no necesita todos los campos)
export type NewPrevisionalData = Omit<Previsional, 'id' | 'month_period' | 'year_period' | 'created_at' | 'updated_at' | 'employee_name' | 'employee_rut' | 'cost_center_name'>;

// Tipo para actualizar un registro (todos los campos son opcionales)
export type UpdatePrevisionalData = Partial<NewPrevisionalData>;

export interface PrevisionalImportItem {
  rut: string;
  nombre: string;
  tipo_previsional: 'afp' | 'isapre' | 'isapre_7' | 'fonasa' | 'seguro_cesantia' | 'mutual';
  centro_costo: string;
  monto: number;
  mes: number;
  año: number;
  fecha_pago?: string;
  notas?: string;
}

// NUEVO: Define el tipo para la respuesta del backend en caso de éxito parcial (207 Multi-Status)
export interface ImportResults {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; error: string; data: PrevisionalImportItem }[];
}

export interface ImportResponse {
  success: boolean;
  message: string;
  results?: ImportResults;
}