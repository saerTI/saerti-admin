// src/services/cashFlowService.ts - Integrado con Remuneraciones
import api from './apiService';
// import ingresosApiService from './ingresosService'; // ELIMINADO - Sistema antiguo

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface CashFlowFilters {
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  year: string;
  projectId?: string;
  costCenterId?: string;
  categoryId?: string;
  status?: string;
}

export interface CashFlowItem {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  state?: 'forecast' | 'actual' | 'budget';
  cost_center_name?: string;
  supplier_name?: string;
  employee_name?: string;
  source_type?: string;
  // Campos específicos para remuneraciones
  employee_rut?: string;
  employee_position?: string;
  work_days?: number;
  payment_method?: string;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  forecastIncome: number;
  forecastExpense: number;
  actualIncome: number;
  actualExpense: number;
  pendingItems: number;
  totalItems: number;
  previousPeriodChange?: number;
  // Desglose por tipo de gasto
  costsExpense: number;
  remuneracionesExpense: number;
}

export interface CashFlowByCategory {
  category_id: number;
  category_name: string;
  category_type: 'income' | 'expense' | 'both';
  income_amount: number;
  expense_amount: number;
  net_amount: number;
  items_count: number;
  path: string;
  source_type?: string; // 'costs', 'remuneraciones', 'mixed'
}

export interface CashFlowData {
  summary: CashFlowSummary;
  recentItems: CashFlowItem[];
  byCategoryData: CashFlowByCategory[];
  emptyCategoriesData: CashFlowByCategory[];
  chartData: CashFlowChartData[];
}

export interface CashFlowChartData {
  name: string;
  income: number;
  expense: number;
  balance: number;
  forecast_income: number;
  forecast_expense: number;
  actual_income: number;
  actual_expense: number;
  // Desglose por fuente
  costs_expense: number;
  remuneraciones_expense: number;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface CashFlowFilterOptions {
  projects: FilterOption[];
  costCenters: FilterOption[];
  categories: FilterOption[];
  states: FilterOption[];
}

// ==========================================
// INTERFACES PARA APIs ESPECÍFICAS
// ==========================================

// Interface para datos de costos
interface CostApiItem {
  cost_id: number;
  transaction_type: string;
  description: string;
  amount: number;
  date: string;
  period_year: number;
  period_month: number;
  status: string;
  cost_center_name: string;
  category_name: string;
  supplier_name?: string;
  employee_name?: string;
  source_type: string;
  period_key: string;
}

// Interface para datos de remuneraciones
interface RemuneracionApiItem {
  id: number;
  employee_id?: number;
  employee_name?: string;
  employee_rut?: string;
  employee_position?: string;
  amount: number;
  net_salary?: number;
  advance_payment?: number;
  area?: string;
  cost_center_id?: number;
  project_code?: string;
  project_name?: string;
  period: string;
  date: string;
  status: string;
  work_days?: number;
  payment_method?: string;
  payment_date?: string;
}

// ==========================================
// API SERVICE CLASS
// ==========================================

class CashFlowApiService {
  /**
   * Obtener datos principales del flujo de caja combinando costos y remuneraciones
   */
  async getCashFlowData(filters: CashFlowFilters): Promise<CashFlowData> {
    try {
      console.log('🔄 Fetching integrated cash flow data with filters:', filters);
      
      // Obtener datos en paralelo
      const [costsData, remuneracionesData] = await Promise.all([
        this.getCostsData(filters),
        this.getRemuneracionesData(filters)
      ]);

      // Combinar items recientes (últimos 50 de ambas fuentes)
      const allItems = [
        ...costsData.items.map(item => this.transformCostToFlowItem(item)),
        ...remuneracionesData.items.map(item => this.transformRemuneracionToFlowItem(item))
      ];

      // Ordenar por fecha (más recientes primero) y tomar los últimos 50
      const recentItems = allItems
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);

      // Combinar categorías
      const byCategoryData = this.combineCategoryData(
        costsData.by_category,
        remuneracionesData.by_category
      );

      // Obtener datos para gráfico combinado
      const chartData = await this.getCashFlowByPeriod(filters);

      // Obtener totales de ingresos y egresos del chart data
      const totalIncome = chartData.reduce((sum, period) => sum + period.income, 0);
      const totalCostsExpense = parseFloat(costsData.summary.total_expenses.toString()) || 0;
      const totalRemuneracionesExpense = parseFloat(remuneracionesData.summary.total_expenses.toString()) || 0;
      const totalExpense = totalCostsExpense + totalRemuneracionesExpense;

      const cashFlowSummary: CashFlowSummary = {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
        forecastIncome: totalIncome,
        forecastExpense: totalExpense,
        actualIncome: totalIncome,
        actualExpense: totalExpense,
        pendingItems: costsData.summary.pending_count + remuneracionesData.summary.pending_count,
        totalItems: costsData.items.length + remuneracionesData.items.length,
        previousPeriodChange: 0,
        // Desglose por tipo
        costsExpense: totalCostsExpense,
        remuneracionesExpense: totalRemuneracionesExpense
      };

      console.log('✅ Integrated cash flow data fetched successfully', {
        costsItems: costsData.items.length,
        remuneracionesItems: remuneracionesData.items.length,
        totalItems: allItems.length,
        totalExpense,
        costsExpense: totalCostsExpense,
        remuneracionesExpense: totalRemuneracionesExpense
      });
      
      return {
        summary: cashFlowSummary,
        recentItems,
        byCategoryData,
        emptyCategoriesData: [],
        chartData
      };
    } catch (error) {
      console.error('❌ Error fetching integrated cash flow data:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al obtener datos de flujo de caja');
    }
  }

  /**
   * Obtener datos de costos
   */
  private async getCostsData(filters: CashFlowFilters) {
    const params = new URLSearchParams();
    
    if (filters.periodType) params.append('period_type', filters.periodType);
    if (filters.year) params.append('year', filters.year);
    if (filters.projectId && filters.projectId !== 'all') {
      params.append('cost_center_id', filters.projectId);
    }
    if (filters.costCenterId && filters.costCenterId !== 'all') {
      params.append('cost_center_id', filters.costCenterId);
    }
    if (filters.categoryId && filters.categoryId !== 'all') {
      params.append('category_id', filters.categoryId);
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get<{
      success: boolean;
      data: {
        summary: {
          total_expenses: number;
          pending_count: number;
        };
        items: CostApiItem[];
        by_category: Array<{
          category_id?: number;
          category_name: string;
          total_amount: number;
          cost_count: number;
        }>;
      };
    }>(`/costs/explore?${params.toString()}`);

    if (!response.success) {
      throw new Error('Error fetching costs data');
    }

    return response.data;
  }

  /**
   * Obtener datos de remuneraciones
   */
  private async getRemuneracionesData(filters: CashFlowFilters) {
    try {
      const params = new URLSearchParams();
      
      // Mapear filtros de cash flow a filtros de remuneraciones
      if (filters.projectId && filters.projectId !== 'all') {
        params.append('projectId', filters.projectId);
      }
      if (filters.costCenterId && filters.costCenterId !== 'all') {
        params.append('projectId', filters.costCenterId); // En remuneraciones se usa projectId
      }
      if (filters.status && filters.status !== 'all') {
        params.append('state', filters.status);
      }

      // Filtro por período/año
      if (filters.year) {
        const periods = this.generatePeriodsForYear(filters.year, filters.periodType);
        periods.forEach(period => params.append('period', period));
      }

      const response = await api.get<{
        success: boolean;
        data: RemuneracionApiItem[];
        message: string;
      }>(`/remuneraciones?${params.toString()}`);

      if (!response.success) {
        throw new Error('Error fetching remuneraciones data');
      }

      // Calcular resumen de remuneraciones
      const items = response.data || [];
      const totalExpenses = items.reduce((sum, item) => sum + (parseFloat(item.amount.toString()) || 0), 0);
      const pendingCount = items.filter(item => item.status === 'pending' || item.status === 'pendiente').length;

      // Agrupar por categoría (área o posición)
      const categoryMap = new Map<string, { total: number; count: number }>();
      
      items.forEach(item => {
        const categoryName = item.area || item.employee_position || 'Remuneraciones Generales';
        const amount = parseFloat(item.amount.toString()) || 0;
        
        if (categoryMap.has(categoryName)) {
          const existing = categoryMap.get(categoryName)!;
          existing.total += amount;
          existing.count += 1;
        } else {
          categoryMap.set(categoryName, { total: amount, count: 1 });
        }
      });

      const by_category = Array.from(categoryMap.entries()).map(([name, data], index) => ({
        category_id: index + 1000, // Usar IDs altos para distinguir de costos
        category_name: name,
        total_amount: data.total,
        cost_count: data.count
      }));

      return {
        summary: {
          total_expenses: totalExpenses,
          pending_count: pendingCount
        },
        items,
        by_category
      };
    } catch (error) {
      console.warn('⚠️ Error fetching remuneraciones data, using empty data:', error);
      // Retornar datos vacíos si hay error para que el cash flow siga funcionando
      return {
        summary: { total_expenses: 0, pending_count: 0 },
        items: [],
        by_category: []
      };
    }
  }

  /**
   * Transformar item de costo a item de cash flow
   */
  private transformCostToFlowItem(item: CostApiItem): CashFlowItem {
    return {
      id: item.cost_id,
      date: item.date,
      description: item.description || 'Sin descripción',
      category: item.category_name || 'Sin categoría',
      amount: parseFloat(item.amount.toString()),
      type: 'expense' as const,
      state: this.mapStatusToState(item.status),
      cost_center_name: item.cost_center_name,
      supplier_name: item.supplier_name,
      employee_name: item.employee_name,
      source_type: 'costs'
    };
  }

  /**
   * Transformar item de remuneración a item de cash flow
   */
  private transformRemuneracionToFlowItem(item: RemuneracionApiItem): CashFlowItem {
    return {
      id: item.id + 100000, // Offset para evitar conflictos con IDs de costos
      date: item.date,
      description: `Remuneración - ${item.employee_name || 'Empleado'}`,
      category: item.area || item.employee_position || 'Remuneraciones',
      amount: parseFloat(item.amount.toString()),
      type: 'expense' as const,
      state: this.mapStatusToState(item.status),
      cost_center_name: item.project_name,
      employee_name: item.employee_name,
      employee_rut: item.employee_rut,
      employee_position: item.employee_position,
      work_days: item.work_days,
      payment_method: item.payment_method,
      source_type: 'remuneraciones'
    };
  }

  /**
   * Combinar datos de categorías de costos y remuneraciones
   */
  private combineCategoryData(
    costsCategories: Array<{ category_id?: number; category_name: string; total_amount: number; cost_count: number }>,
    remuneracionesCategories: Array<{ category_id?: number; category_name: string; total_amount: number; cost_count: number }>
  ): CashFlowByCategory[] {
    const combined: CashFlowByCategory[] = [];

    // Agregar categorías de costos
    costsCategories.forEach((cat, index) => {
      combined.push({
        category_id: cat.category_id || index + 1,
        category_name: cat.category_name,
        category_type: 'expense' as const,
        income_amount: 0,
        expense_amount: parseFloat(cat.total_amount.toString()) || 0,
        net_amount: -(parseFloat(cat.total_amount.toString()) || 0),
        items_count: cat.cost_count || 0,
        path: `/cash-flow/categories/${cat.category_id || index + 1}`,
        source_type: 'costs'
      });
    });

    // Agregar categorías de remuneraciones
    remuneracionesCategories.forEach((cat, index) => {
      combined.push({
        category_id: cat.category_id || (index + 1000),
        category_name: `${cat.category_name} (Remuneraciones)`,
        category_type: 'expense' as const,
        income_amount: 0,
        expense_amount: parseFloat(cat.total_amount.toString()) || 0,
        net_amount: -(parseFloat(cat.total_amount.toString()) || 0),
        items_count: cat.cost_count || 0,
        path: `/cash-flow/categories/${cat.category_id || (index + 1000)}`,
        source_type: 'remuneraciones'
      });
    });

    return combined;
  }

  /**
   * Obtener datos de flujo de caja por período combinando todas las fuentes (ingresos + egresos)
   */
  async getCashFlowByPeriod(filters: CashFlowFilters): Promise<CashFlowChartData[]> {
    try {
      console.log('🔄 Fetching cash flow by period (combined incomes + expenses):', filters);

      // Obtener datos de todas las fuentes en paralelo
      const [incomesChart, expensesChart, costsChart, remuneracionesChart] = await Promise.all([
        this.getIncomesByPeriod(filters),
        this.getExpensesByPeriod(filters),
        this.getCostsByPeriod(filters),
        this.getRemuneracionesByPeriod(filters)
      ]);

      // Combinar datos por período
      const periodMap = new Map<string, CashFlowChartData>();

      // Procesar datos de ingresos
      incomesChart.forEach(item => {
        if (!periodMap.has(item.name)) {
          periodMap.set(item.name, {
            name: item.name,
            income: 0,
            expense: 0,
            balance: 0,
            forecast_income: 0,
            forecast_expense: 0,
            actual_income: 0,
            actual_expense: 0,
            costs_expense: 0,
            remuneraciones_expense: 0
          });
        }

        const period = periodMap.get(item.name)!;
        period.income += item.income;
        period.forecast_income += item.forecast_income;
        period.actual_income += item.actual_income;
      });

      // Procesar datos de egresos dinámicos
      expensesChart.forEach(item => {
        if (!periodMap.has(item.name)) {
          periodMap.set(item.name, {
            name: item.name,
            income: 0,
            expense: 0,
            balance: 0,
            forecast_income: 0,
            forecast_expense: 0,
            actual_income: 0,
            actual_expense: 0,
            costs_expense: 0,
            remuneraciones_expense: 0
          });
        }

        const period = periodMap.get(item.name)!;
        period.expense += item.expense;
        period.forecast_expense += item.forecast_expense;
        period.actual_expense += item.actual_expense;
      });

      // Procesar datos de costos
      costsChart.forEach(item => {
        if (!periodMap.has(item.name)) {
          periodMap.set(item.name, {
            name: item.name,
            income: 0,
            expense: 0,
            balance: 0,
            forecast_income: 0,
            forecast_expense: 0,
            actual_income: 0,
            actual_expense: 0,
            costs_expense: 0,
            remuneraciones_expense: 0
          });
        }

        const period = periodMap.get(item.name)!;
        period.costs_expense = item.expense;
        period.expense += item.expense;
        period.forecast_expense += item.forecast_expense;
        period.actual_expense += item.actual_expense;
      });

      // Procesar datos de remuneraciones
      remuneracionesChart.forEach(item => {
        if (!periodMap.has(item.name)) {
          periodMap.set(item.name, {
            name: item.name,
            income: 0,
            expense: 0,
            balance: 0,
            forecast_income: 0,
            forecast_expense: 0,
            actual_income: 0,
            actual_expense: 0,
            costs_expense: 0,
            remuneraciones_expense: 0
          });
        }

        const period = periodMap.get(item.name)!;
        period.remuneraciones_expense = item.expense;
        period.expense += item.expense;
        period.forecast_expense += item.forecast_expense;
        period.actual_expense += item.actual_expense;
      });

      // Calcular balance final
      const chartData = Array.from(periodMap.values()).map(period => ({
        ...period,
        balance: period.income - period.expense
      }));

      console.log('✅ Combined period data fetched successfully:', chartData.length, 'periods', {
        totalIncome: chartData.reduce((sum, p) => sum + p.income, 0),
        totalExpense: chartData.reduce((sum, p) => sum + p.expense, 0)
      });

      return chartData;
    } catch (error) {
      console.error('❌ Error fetching combined period data:', error);
      return [];
    }
  }

  /**
   * Obtener datos de ingresos por período
   */
  private async getIncomesByPeriod(filters: CashFlowFilters): Promise<CashFlowChartData[]> {
    try {
      const period = this.mapPeriodType(filters.periodType);
      const params: any = { period };

      if (filters.year) {
        const yearNum = parseInt(filters.year);
        params.date_from = `${yearNum}-01-01`;
        params.date_to = `${yearNum}-12-31`;
      }

      if (filters.costCenterId && filters.costCenterId !== 'all') {
        params.cost_center_id = filters.costCenterId;
      }

      const response = await api.get<{
        success: boolean;
        data: Array<{
          period_label: string;
          total_amount: number;
          count: number;
        }>;
      }>('/incomes/dashboard/cash-flow', { params });

      if (!response.success) {
        return [];
      }

      return response.data.map(item => ({
        name: item.period_label,
        income: parseFloat(item.total_amount.toString()) || 0,
        expense: 0,
        balance: parseFloat(item.total_amount.toString()) || 0,
        forecast_income: parseFloat(item.total_amount.toString()) || 0,
        forecast_expense: 0,
        actual_income: parseFloat(item.total_amount.toString()) || 0,
        actual_expense: 0,
        costs_expense: 0,
        remuneraciones_expense: 0
      }));
    } catch (error) {
      console.warn('⚠️ Error fetching incomes by period:', error);
      return [];
    }
  }

  /**
   * Obtener datos de egresos por período
   */
  private async getExpensesByPeriod(filters: CashFlowFilters): Promise<CashFlowChartData[]> {
    try {
      const period = this.mapPeriodType(filters.periodType);
      const params: any = { period };

      if (filters.year) {
        const yearNum = parseInt(filters.year);
        params.date_from = `${yearNum}-01-01`;
        params.date_to = `${yearNum}-12-31`;
      }

      if (filters.costCenterId && filters.costCenterId !== 'all') {
        params.cost_center_id = filters.costCenterId;
      }

      const response = await api.get<{
        success: boolean;
        data: Array<{
          period_label: string;
          total_amount: number;
          count: number;
        }>;
      }>('/expenses/dashboard/cash-flow', { params });

      if (!response.success) {
        return [];
      }

      return response.data.map(item => ({
        name: item.period_label,
        income: 0,
        expense: parseFloat(item.total_amount.toString()) || 0,
        balance: -parseFloat(item.total_amount.toString()) || 0,
        forecast_income: 0,
        forecast_expense: parseFloat(item.total_amount.toString()) || 0,
        actual_income: 0,
        actual_expense: parseFloat(item.total_amount.toString()) || 0,
        costs_expense: 0,
        remuneraciones_expense: 0
      }));
    } catch (error) {
      console.warn('⚠️ Error fetching expenses by period:', error);
      return [];
    }
  }

  /**
   * Obtener datos de costos por período
   */
  private async getCostsByPeriod(filters: CashFlowFilters): Promise<CashFlowChartData[]> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          const backendKey = key === 'costCenterId' ? 'cost_center_id' : 
                           key === 'categoryId' ? 'category_id' : key;
          params.append(backendKey, value.toString());
        }
      });

      const response = await api.get<{
        success: boolean;
        data: Array<{
          category_name: string;
          period_key: string;
          total_amount: number;
        }>;
      }>(`/costs/by-period?${params.toString()}`);

      if (!response.success) {
        return [];
      }

      const periodTotals: Record<string, number> = {};
      
      response.data.forEach(item => {
        const periodKey = item.period_key;
        const amount = parseFloat(item.total_amount.toString()) || 0;
        
        if (!periodTotals[periodKey]) {
          periodTotals[periodKey] = 0;
        }
        periodTotals[periodKey] += amount;
      });

      return Object.entries(periodTotals).map(([period, expense]) => ({
        name: this.formatPeriodName(period, filters.periodType),
        income: 0,
        expense,
        balance: -expense,
        forecast_income: 0,
        forecast_expense: expense,
        actual_income: 0,
        actual_expense: expense,
        costs_expense: expense,
        remuneraciones_expense: 0
      }));
    } catch (error) {
      console.warn('⚠️ Error fetching costs by period:', error);
      return [];
    }
  }

  /**
   * Obtener datos de remuneraciones por período
   */
  private async getRemuneracionesByPeriod(filters: CashFlowFilters): Promise<CashFlowChartData[]> {
    try {
      // Aquí necesitarías implementar un endpoint similar al de costos para remuneraciones
      // Por ahora, simular agrupación por período desde los datos existentes
      const remuneracionesData = await this.getRemuneracionesData(filters);
      
      const periodTotals: Record<string, number> = {};
      
      remuneracionesData.items.forEach(item => {
        const date = new Date(item.date);
        const periodKey = this.generatePeriodKey(date, filters.periodType);
        const amount = parseFloat(item.amount.toString()) || 0;
        
        if (!periodTotals[periodKey]) {
          periodTotals[periodKey] = 0;
        }
        periodTotals[periodKey] += amount;
      });

      return Object.entries(periodTotals).map(([period, expense]) => ({
        name: this.formatPeriodName(period, filters.periodType),
        income: 0,
        expense,
        balance: -expense,
        forecast_income: 0,
        forecast_expense: expense,
        actual_income: 0,
        actual_expense: expense,
        costs_expense: 0,
        remuneraciones_expense: expense
      }));
    } catch (error) {
      console.warn('⚠️ Error fetching remuneraciones by period:', error);
      return [];
    }
  }

  /**
   * Obtener opciones para filtros combinando ambas fuentes
   */
  async getFilterOptions(): Promise<CashFlowFilterOptions> {
    try {
      console.log('🔄 Fetching combined filter options...');
      
      // Obtener opciones de ambas fuentes
      const [costsOptions, remuneracionesOptions] = await Promise.all([
        this.getCostsFilterOptions(),
        this.getRemuneracionesFilterOptions()
      ]);

      // Combinar y deduplicar opciones
      const combinedProjects = this.combineAndDeduplicateOptions(
        costsOptions.projects || [],
        remuneracionesOptions.projects || []
      );

      const combinedCostCenters = this.combineAndDeduplicateOptions(
        costsOptions.costCenters || [],
        remuneracionesOptions.costCenters || []
      );

      // Para categorías, mantener separadas por fuente
      const combinedCategories = [
        ...costsOptions.categories.map(cat => ({ ...cat, label: `${cat.label} (Costos)` })),
        ...remuneracionesOptions.categories.map(cat => ({ ...cat, label: `${cat.label} (Remuneraciones)` }))
      ];

      console.log('✅ Combined filter options fetched successfully');
      
      return {
        projects: combinedProjects,
        costCenters: combinedCostCenters,
        categories: combinedCategories,
        states: [
          { value: 'forecast', label: 'Presupuestado' },
          { value: 'actual', label: 'Real' },
          { value: 'budget', label: 'Presupuesto' },
          { value: 'pending', label: 'Pendiente' },
          { value: 'approved', label: 'Aprobado' },
          { value: 'paid', label: 'Pagado' }
        ]
      };
    } catch (error) {
      console.error('❌ Error fetching combined filter options:', error);
      
      return {
        projects: [],
        costCenters: [],
        categories: [],
        states: [
          { value: 'forecast', label: 'Presupuestado' },
          { value: 'actual', label: 'Real' },
          { value: 'budget', label: 'Presupuesto' }
        ]
      };
    }
  }

  // ==========================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ==========================================

  private async getCostsFilterOptions(): Promise<CashFlowFilterOptions> {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          cost_centers: Array<{ id: number; name: string; type?: string }>;
          categories: Array<{ id: number; name: string; group_name?: string }>;
          statuses: Array<{ value: string; label: string }>;
        };
      }>('/costs/dimensions');

      if (!response.success || !response.data) {
        throw new Error('Invalid response format');
      }

      const { cost_centers, categories, statuses } = response.data;

      return {
        projects: cost_centers.filter(cc => cc.type === 'project').map(cc => ({
          value: cc.id.toString(),
          label: cc.name
        })),
        costCenters: cost_centers.map(cc => ({
          value: cc.id.toString(),
          label: `${cc.name}${cc.type ? ` (${cc.type})` : ''}`
        })),
        categories: categories.map(cat => ({
          value: cat.id.toString(),
          label: cat.group_name ? `${cat.group_name}: ${cat.name}` : cat.name
        })),
        states: statuses
      };
    } catch (error) {
      console.warn('⚠️ Error fetching costs filter options:', error);
      return { projects: [], costCenters: [], categories: [], states: [] };
    }
  }

  private async getRemuneracionesFilterOptions(): Promise<CashFlowFilterOptions> {
    try {
      // Obtener datos de remuneraciones para extraer opciones únicas
      const response = await api.get<{
        success: boolean;
        data: RemuneracionApiItem[];
      }>('/remuneraciones');

      if (!response.success || !response.data) {
        throw new Error('Invalid response format');
      }

      const items = response.data;

      // Extraer proyectos únicos
      const projectsSet = new Set<string>();
      const costCentersSet = new Set<string>();
      const categoriesSet = new Set<string>();

      items.forEach(item => {
        if (item.cost_center_id && item.project_name) {
          projectsSet.add(`${item.cost_center_id}|${item.project_name}`);
          costCentersSet.add(`${item.cost_center_id}|${item.project_name}`);
        }
        if (item.area) {
          categoriesSet.add(`area|${item.area}`);
        }
        if (item.employee_position) {
          categoriesSet.add(`position|${item.employee_position}`);
        }
      });

      return {
        projects: Array.from(projectsSet).map(p => {
          const [id, name] = p.split('|');
          return { value: id, label: name };
        }),
        costCenters: Array.from(costCentersSet).map(cc => {
          const [id, name] = cc.split('|');
          return { value: id, label: name };
        }),
        categories: Array.from(categoriesSet).map(c => {
          const [type, name] = c.split('|');
          return { 
            value: `${type}-${name}`, 
            label: type === 'area' ? `Área: ${name}` : `Posición: ${name}`
          };
        }),
        states: [
          { value: 'pending', label: 'Pendiente' },
          { value: 'approved', label: 'Aprobado' },
          { value: 'paid', label: 'Pagado' }
        ]
      };
    } catch (error) {
      console.warn('⚠️ Error fetching remuneraciones filter options:', error);
      return { projects: [], costCenters: [], categories: [], states: [] };
    }
  }

  private combineAndDeduplicateOptions(options1: FilterOption[], options2: FilterOption[]): FilterOption[] {
    const combined = [...options1, ...options2];
    const unique = new Map<string, FilterOption>();
    
    combined.forEach(option => {
      if (!unique.has(option.value) || unique.get(option.value)!.label.length < option.label.length) {
        unique.set(option.value, option);
      }
    });
    
    return Array.from(unique.values());
  }

  private mapStatusToState(status: string): 'forecast' | 'actual' | 'budget' {
    switch (status?.toLowerCase()) {
      case 'aprobado':
      case 'pagado':
      case 'depositado':
      case 'paid':
        return 'actual';
      case 'presupuestado':
      case 'proyectado':
      case 'forecast':
        return 'forecast';
      case 'presupuesto':
      case 'budget':
        return 'budget';
      default:
        return 'actual';
    }
  }

  private formatPeriodName(periodKey: string, periodType: string): string {
    try {
      switch (periodType) {
        case 'monthly':
          const [year, month] = periodKey.split('-');
          const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];
          return monthNames[parseInt(month) - 1] || periodKey;
          
        case 'weekly':
          return periodKey.replace(/(\d{4})-W(\d{2})/, 'Semana $2');
          
        case 'quarterly':
          return periodKey.replace(/(\d{4})-Q(\d)/, 'Q$2 $1');
          
        case 'annual':
          return periodKey;
          
        default:
          return periodKey;
      }
    } catch (error) {
      console.warn('Error formatting period name:', error);
      return periodKey;
    }
  }

  private generatePeriodKey(date: Date, periodType: string): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    switch (periodType) {
      case 'monthly':
        return `${year}-${month.toString().padStart(2, '0')}`;
        
      case 'weekly':
        const week = this.getWeekNumber(date);
        return `${year}-W${week.toString().padStart(2, '0')}`;
        
      case 'quarterly':
        const quarter = Math.ceil(month / 3);
        return `${year}-Q${quarter}`;
        
      case 'annual':
        return year.toString();
        
      default:
        return `${year}-${month.toString().padStart(2, '0')}`;
    }
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Crear un nuevo item de flujo de caja
   */
  async createCashFlowItem(data: { date: string; description: string; categoryId: number; amount: number; type: 'income' | 'expense' }): Promise<any> {
    try {
      if (data.type === 'income') {
        // Crear ingreso
        const ingresoData = {
          document_number: `CF-${Date.now()}`, // Generar número de documento único
          ep_detail: data.description,
          client_name: 'Flujo de Caja Manual', // Cliente por defecto
          client_tax_id: '99999999-9', // RUT por defecto
          ep_total: data.amount,
          total_amount: data.amount,
          date: data.date,
          category_id: data.categoryId,
          state: 'activo' as const,
          payment_status: 'pagado' as const
        };

        // const result = await ingresosApiService.createIngreso(ingresoData); // ELIMINADO
        throw new Error("Función de ingresos deshabilitada - usar nuevo sistema dinámico");
      } else {
        // Para gastos, por ahora no implementado
        throw new Error('La creación de gastos desde flujo de caja no está implementada aún. Use el módulo de costos.');
      }
    } catch (error) {
      console.error('Error creating cash flow item:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al crear item de flujo de caja');
    }
  }

  /**
   * Actualizar un item existente de flujo de caja
   */
  async updateCashFlowItem(id: number, data: { date: string; description: string; categoryId: number; amount: number; type: 'income' | 'expense' }): Promise<any> {
    try {
      if (data.type === 'income') {
        // Actualizar ingreso
        const ingresoData = {
          ep_detail: data.description,
          ep_total: data.amount,
          total_amount: data.amount,
          date: data.date,
          category_id: data.categoryId
        };

        // const result = await ingresosApiService.updateIngreso(id, ingresoData); // ELIMINADO
        throw new Error("Función de ingresos deshabilitada - usar nuevo sistema dinámico");
      } else {
        // Para gastos, por ahora no implementado
        throw new Error('La actualización de gastos desde flujo de caja no está implementada aún. Use el módulo de costos.');
      }
    } catch (error) {
      console.error('Error updating cash flow item:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al actualizar item de flujo de caja');
    }
  }

  private mapPeriodType(periodType: string): 'week' | 'month' | 'quarter' | 'year' {
    const mapping: Record<string, 'week' | 'month' | 'quarter' | 'year'> = {
      'weekly': 'week',
      'monthly': 'month',
      'quarterly': 'quarter',
      'annual': 'year'
    };
    return mapping[periodType] || 'month';
  }

  private generatePeriodsForYear(year: string, periodType: string): string[] {
    const periods: string[] = [];
    const yearNum = parseInt(year);

    switch (periodType) {
      case 'monthly':
        for (let month = 1; month <= 12; month++) {
          periods.push(`${year}-${month.toString().padStart(2, '0')}`);
        }
        break;

      case 'weekly':
        for (let week = 1; week <= 52; week++) {
          periods.push(`${year}-W${week.toString().padStart(2, '0')}`);
        }
        break;

      case 'quarterly':
        for (let quarter = 1; quarter <= 4; quarter++) {
          periods.push(`${year}-Q${quarter}`);
        }
        break;

      case 'annual':
        periods.push(year);
        break;

      default:
        periods.push(year);
    }

    return periods;
  }
}

// ==========================================
// EXPORT SERVICE INSTANCE
// ==========================================

export const cashFlowApiService = new CashFlowApiService();
export default cashFlowApiService;