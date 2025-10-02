// src/types/factoring.ts

export interface FactoringEntity {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CostCenter {
  id: number;
  name: string;
  code?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Factoring {
  id: number;
  factoring_entities_id: number;
  cost_center_id: number;
  interest_rate: number;
  mount: number;
  date_factoring: string;
  date_expiration: string;
  payment_status: number;
  status: 'Pendiente' | 'Girado y no pagado' | 'Girado y pagado';
  created_at?: string;
  updated_at?: string;
  // Objetos anidados que vienen del backend
  entity: {
    id: number;
    name: string;
  };
  costCenter: {
    id: number;
    name: string;
    code?: string;
  };
}

export interface CreateFactoringRequest {
  factoring_entities_id: number;
  cost_center_id: number;
  interest_rate: number;
  mount: number;
  date_factoring: string;
  date_expiration: string;
  payment_status: number;
  status: 'Pendiente' | 'Girado y no pagado' | 'Girado y pagado';
}

export interface UpdateFactoringRequest extends Partial<CreateFactoringRequest> {
  id: number;
}

export interface FactoringFilter {
  status?: string;
  factoring_entities_id?: number;
  cost_center_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface FactoringResponse {
  success: boolean;
  data: Factoring[];
  message?: string;
}

export interface FactoringEntityResponse {
  success: boolean;
  data: FactoringEntity[];
  message?: string;
}

export interface SingleFactoringResponse {
  success: boolean;
  data: Factoring;
  message?: string;
}

export interface FactoringTotalResponse {
  success: boolean;
  data: {
    total_amount: number;
    total_pendiente: number;
    total_giradoynopagado: number;
    total_giradoypagado: number;
  };
  message?: string;
}

// Status options para el dropdown
export const FACTORING_STATUS_OPTIONS = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Girado y no pagado', label: 'Girado y no pagado' },
  { value: 'Girado y pagado', label: 'Girado y pagado' }
] as const;

export type FactoringStatus = typeof FACTORING_STATUS_OPTIONS[number]['value'];