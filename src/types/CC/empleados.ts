export interface Empleado {
    id: number;
    tax_id?: string; 
    full_name?: string; 
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    emergency_phone?: string;
    position?: string;
    department?: string;
    hire_date?: string; 
    termination_date?: string;
    default_cost_center_id?: number;
    cost_center_name?: string; 
    salary_base?: number; 
    active?: boolean; 
    created_at?: string; 
    updated_at?: string; 
}

export interface Pagination {
    current_page: number;
    total_pages: number;
    total: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: Pagination;
}

export interface EmpleadoFilter {
    search?: string;
    active?: string;
    department?: string;
    position?: string;
    cost_center?: string;
    page?: number;
    per_page?: number;
}