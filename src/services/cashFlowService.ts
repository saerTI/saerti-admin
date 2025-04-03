// src/services/cashFlowService.ts
import odooAPI from './odooService';
import { CashFlowItem, DateRange } from '../pages/CashFlow/CashFlowData';

// Interface for creating a new cash flow item
export interface CreateCashFlowItemData {
  date: string;
  description: string;
  category_id: number;
  amount: number;
  type: 'income' | 'expense';
}

// Service to handle cash flow operations
const cashFlowService = {
  /**
   * Create a new cash flow item
   */
  async createCashFlowItem(data: CreateCashFlowItemData): Promise<number> {
    try {
      // Assuming 'cash.flow.item' is the model name in Odoo
      const recordId = await odooAPI.create('cash.flow.item', data);
      return recordId;
    } catch (error) {
      console.error('Error creating cash flow item:', error);
      throw new Error('No se pudo crear el registro de flujo de caja');
    }
  },

  /**
   * Update an existing cash flow item
   */
  async updateCashFlowItem(id: number, data: Partial<CreateCashFlowItemData>): Promise<boolean> {
    try {
      const result = await odooAPI.write('cash.flow.item', [id], data);
      return result;
    } catch (error) {
      console.error('Error updating cash flow item:', error);
      throw new Error('No se pudo actualizar el registro de flujo de caja');
    }
  },

  /**
   * Delete a cash flow item
   */
  async deleteCashFlowItem(id: number): Promise<boolean> {
    try {
      const result = await odooAPI.unlink('cash.flow.item', [id]);
      return result;
    } catch (error) {
      console.error('Error deleting cash flow item:', error);
      throw new Error('No se pudo eliminar el registro de flujo de caja');
    }
  },
  
  /**
   * Import cash flow data from Excel
   */
  async importFromExcel(fileData: string): Promise<any> {
    try {
      const result = await odooAPI.importCashFlowFromExcel(fileData);
      return result;
    } catch (error) {
      console.error('Error importing cash flow data from Excel:', error);
      throw new Error('No se pudo importar los datos de Excel');
    }
  },
  
  /**
   * Export cash flow data to report format
   */
  async exportReport(dateRange: DateRange, format: 'pdf' | 'xlsx' = 'pdf'): Promise<string> {
    try {
      const result = await odooAPI.generateCashFlowReport(
        dateRange.startDate,
        dateRange.endDate,
        { format }
      );
      return result;
    } catch (error) {
      console.error('Error exporting cash flow report:', error);
      throw new Error('No se pudo generar el reporte');
    }
  }
};

export default cashFlowService;