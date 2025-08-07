// Actualización del archivo services/gastosService.ts para incluir nuevas propiedades
import api from './apiService';
import { OrdenCompra as ImportedOrdenCompra } from '../types/CC/ordenCompra';

// Re-export the OrdenCompra type from the new types file
export type OrdenCompra = ImportedOrdenCompra;

// Updated GastoFilter interface to include new filter options
export interface GastoFilter {
  // Existing filters
  projectId?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  state?: string;
  
  // New filters for orden de compra
  grupoCuenta?: string;
  paymentType?: string;
  cuentaContable?: string;
  centroCostoId?: number;
  estadoPago?: string;
  tieneFactura?: boolean;
  providerId?: number;
  search?: string;
  orderNumber?: string;
  
  // Pagination and sorting
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
export interface IOrdenCompraDetail {
  id: number
  name: string
  order_number: string
  description: string
  cost_center_id: number
  account_category_id: number
  provider_name: string
  amount: number
  date: string
  payment_type: string
  state: string
  notes: string
  created_at: string
  updated_at: string
  center_code: string
  center_name: string
  categoria_name: string
  supplier_name: any
}

// Mock service implementation
export const gastosApiService = {
  async getOrdenesCompra(filters: GastoFilter = {}): Promise<OrdenCompra[]> {
    // This would be replaced with actual API calls
    return getMockOrdenesCompra();
  },

  async getOrdenCompraById(id: number): Promise<IOrdenCompraDetail | null> {
    console.log('🔍 Fetching orden de compra by ID:', id);
    // const ordenes = await getMockOrdenesCompra();
    // return ordenes.find(orden => orden.id === id) || null;
    try {
        const response = await api.get<{success: boolean, data: IOrdenCompraDetail}>(`/api/ordenes-compra/${id}`);
        console.log('🔍 Orden de compra fetched:', response.data);
        return response.data;
      } catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        throw new Error('Failed to fetch project details');
      }
  },

  async createOrdenCompra(data: Partial<OrdenCompra>): Promise<OrdenCompra> {
    // Mock implementation
    const newOrden: OrdenCompra = {
      id: Date.now(),
      ...data
    } as OrdenCompra;
    return newOrden;
  },

  async updateOrdenCompra(id: number, data: Partial<IOrdenCompraDetail>): Promise<IOrdenCompraDetail> {
    // Mock implementation
    const existingOrden = await this.getOrdenCompraById(id);
    if (!existingOrden) {
      throw new Error('Orden de compra not found');
    }
    return { ...existingOrden, ...data };
  },

  async deleteOrdenCompra(id: number): Promise<boolean> {
    // Mock implementation
    return true;
  },

  async exportOrdenesCompra(filters: GastoFilter = {}): Promise<Blob> {
    // Mock implementation - would return Excel file blob
    return new Blob(['mock excel data'], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }
};

// Mock data function (to be replaced with actual API call)
async function getMockOrdenesCompra(): Promise<OrdenCompra[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // This is the existing mock data from the component
  // ... (the same mock data as in the component)
  
  return []; // Placeholder - the actual mock data would go here
}

// Export default for backward compatibility
export default gastosApiService;