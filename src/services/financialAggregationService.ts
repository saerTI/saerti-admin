// src/services/financialAggregationService.ts

import { getRemuneracionesByPeriod } from './CC/remuneracionesService';
import { factoringService } from './factoringService';
import { previsionalesService } from './CC/previsionalesService';
import { getFixedCosts } from './CC/fixedCostsService';
import { accountCategoriesService, AccountCategoryType, AccountCategory } from './accountCategoriesService';
import { getItemsByAccountCategory, ItemFilters, PurchaseOrderItem } from './CC/ordenesCompraItemService';
import { FinancialPeriod } from '../components/tables/FinancialTable';

export interface FinancialDataByPeriod {
  remuneraciones: Record<string, number>;
  factoring: Record<string, number>;
  previsionales: Record<string, number>;
  costosFijos: Record<string, number>;
  // Nuevas categorías dinámicas basadas en account_categories
  [categoryKey: string]: Record<string, number>;
}

export interface CategoryFinancialData {
  [categoryKey: string]: Record<string, number>;
}

export interface ExpandedFinancialDataByPeriod extends FinancialDataByPeriod {
  accountCategories: CategoryFinancialData;
}

export interface FinancialAggregationOptions {
  periods: FinancialPeriod[];
  year: number;
  costCenterId?: number; // Optional cost center filter
}

/**
 * Service to handle financial data aggregation from multiple sources
 */
export class FinancialAggregationService {
  /**
   * Helper function to determine period ID from a date
   * Supports weekly, monthly, quarterly, and annual periods
   */
  private static getPeriodIdFromDate(date: Date, periods: FinancialPeriod[]): string | null {
    if (!periods || periods.length === 0) return null;

    const firstPeriodId = periods[0].id;

    // Determine period type from the first period ID
    if (firstPeriodId.startsWith('week-')) {
      // Weekly: Calculate week number
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.ceil((daysSinceStart + 1) / 7);
      return `week-${Math.min(weekNumber, 52)}`; // Cap at 52 weeks
    } else if (firstPeriodId.startsWith('month-')) {
      // Monthly: Get month number (1-12)
      return `month-${date.getMonth() + 1}`;
    } else if (firstPeriodId.startsWith('quarter-')) {
      // Quarterly: Calculate quarter (1-4)
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `quarter-${quarter}`;
    } else {
      // Annual: Just the year
      return date.getFullYear().toString();
    }
  }

  /**
   * Load all financial data for the given periods and year
   */
  static async getAllFinancialData(options: FinancialAggregationOptions): Promise<FinancialDataByPeriod> {
    const { periods, year, costCenterId } = options;

    try {
      // Load predefined categories and account categories in parallel
      const [
        remuneraciones,
        factoring,
        previsionales,
        costosFijos,
        accountCategoriesData
      ] = await Promise.allSettled([
        this.getRemuneracionesData(periods, year, costCenterId),
        this.getFactoringData(periods, year, costCenterId),
        this.getPrevisionalesData(periods, year, costCenterId),
        this.getCostosFijosData(periods, year, costCenterId),
        this.getAccountCategoriesData(periods, year, costCenterId)
      ]);

      const result: FinancialDataByPeriod = {
        remuneraciones: remuneraciones.status === 'fulfilled' ? remuneraciones.value : this.initializeEmptyPeriods(periods),
        factoring: factoring.status === 'fulfilled' ? factoring.value : this.initializeEmptyPeriods(periods),
        previsionales: previsionales.status === 'fulfilled' ? previsionales.value : this.initializeEmptyPeriods(periods),
        costosFijos: costosFijos.status === 'fulfilled' ? costosFijos.value : this.initializeEmptyPeriods(periods)
      };

      // Add account categories data
      if (accountCategoriesData.status === 'fulfilled') {
        console.log('🔄 Adding account categories data to result:', accountCategoriesData.value);
        Object.assign(result, accountCategoriesData.value);
        console.log('✅ Final result with categories:', result);
      } else {
        console.log('❌ Account categories data failed:', accountCategoriesData.reason);
      }

      return result;
    } catch (error) {
      console.error('Error loading all financial data:', error);

      // Return minimal data structure on error
      return {
        remuneraciones: this.initializeEmptyPeriods(periods),
        factoring: this.initializeEmptyPeriods(periods),
        previsionales: this.initializeEmptyPeriods(periods),
        costosFijos: this.initializeEmptyPeriods(periods)
      };
    }
  }

  /**
   * Get remuneraciones data aggregated by period
   */
  static async getRemuneracionesData(periods: FinancialPeriod[], year: number, costCenterId?: number): Promise<Record<string, number>> {
    const remuneracionesAmounts: Record<string, number> = this.initializeEmptyPeriods(periods);

    try {
      // Load all remuneraciones for the year
      const allRemuneraciones: any[] = [];
      for (let month = 1; month <= 12; month++) {
        try {
          const monthData = await getRemuneracionesByPeriod(month, year);
          monthData.forEach(rem => {
            allRemuneraciones.push({
              ...rem,
              date: rem.date || `${year}-${month.toString().padStart(2, '0')}-01`
            });
          });
        } catch (error) {
          console.error(`Error loading remuneraciones for month ${month}:`, error);
        }
      }

      // Group by period
      allRemuneraciones.forEach(rem => {
        // Filter by cost center if specified
        if (costCenterId && rem.projectId !== costCenterId) {
          return;
        }

        const remDate = new Date(rem.date);
        const periodId = this.getPeriodIdFromDate(remDate, periods);

        if (periodId && remuneracionesAmounts.hasOwnProperty(periodId)) {
          const amount = rem.amount || rem.sueldoLiquido || 0;
          const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
          remuneracionesAmounts[periodId] += isNaN(numericAmount) ? 0 : numericAmount;
        }
      });

      return remuneracionesAmounts;
    } catch (error) {
      console.error('Error loading remuneraciones data:', error);
      return this.initializeEmptyPeriods(periods);
    }
  }

  /**
   * Get factoring data aggregated by period
   */
  static async getFactoringData(periods: FinancialPeriod[], year: number, costCenterId?: number): Promise<Record<string, number>> {
    const factoringAmounts: Record<string, number> = this.initializeEmptyPeriods(periods);

    try {
      // Load all factorings for the year and filter in frontend
      const allFactorings = await factoringService.getFactorings();

      // Filter and group factorings by period
      allFactorings.forEach(factoring => {
        if (factoring.date_factoring) {
          // Filter by cost center if specified
          if (costCenterId && factoring.cost_center_id !== costCenterId) {
            return;
          }

          const factoringDate = new Date(factoring.date_factoring);
          const factoringYear = factoringDate.getFullYear();

          // Only process if it's from the selected year
          if (factoringYear === year) {
            const periodId = this.getPeriodIdFromDate(factoringDate, periods);

            if (periodId && factoringAmounts.hasOwnProperty(periodId)) {
              // Ensure we're working with numbers, not strings
              const mount = typeof factoring.mount === 'string' ? parseFloat(factoring.mount) : Number(factoring.mount);
              const interestRate = typeof factoring.interest_rate === 'string' ? parseFloat(factoring.interest_rate) : Number(factoring.interest_rate);

              // Calculate factoring cost: mount * (interest_rate / 100)
              const factoringCost = (isNaN(mount) ? 0 : mount) * (isNaN(interestRate) ? 0 : interestRate) / 100;

              factoringAmounts[periodId] += factoringCost;
            }
          }
        }
      });

      return factoringAmounts;
    } catch (error) {
      console.error('Error loading factoring data:', error);
      return this.initializeEmptyPeriods(periods);
    }
  }

  /**
   * Get previsionales data aggregated by period
   */
  static async getPrevisionalesData(periods: FinancialPeriod[], year: number, costCenterId?: number): Promise<Record<string, number>> {
    const previsionalesAmounts: Record<string, number> = this.initializeEmptyPeriods(periods);

    try {
      // Load all previsionales and filter in frontend
      const response = await previsionalesService.getPrevisionales({ limit: 1000 }); // Get a large number to include all records
      const allPrevisionales = response.data;

      // Filter and group previsionales by period
      allPrevisionales.forEach(previsional => {
        if (previsional.date) {
          // Note: For cost center filtering in previsionales, we would need to:
          // 1. Either extend the API to include cost center data
          // 2. Or make a separate call to get employee-cost center mappings
          // For now, we skip cost center filtering for previsionales
          // TODO: Implement cost center filtering for previsionales

          const previsionalDate = new Date(previsional.date);
          const previsionalYear = previsionalDate.getFullYear();

          // Only process if it's from the selected year
          if (previsionalYear === year) {
            const periodId = this.getPeriodIdFromDate(previsionalDate, periods);

            if (periodId && previsionalesAmounts.hasOwnProperty(periodId)) {
              // Ensure we're working with numbers, not strings
              const amount = typeof previsional.amount === 'string' ? parseFloat(previsional.amount) : Number(previsional.amount);
              previsionalesAmounts[periodId] += isNaN(amount) ? 0 : amount;
            }
          }
        }
      });

      return previsionalesAmounts;
    } catch (error) {
      console.error('Error loading previsionales data:', error);
      return this.initializeEmptyPeriods(periods);
    }
  }

  /**
   * Get costos fijos data aggregated by period
   */
  static async getCostosFijosData(periods: FinancialPeriod[], year: number, costCenterId?: number): Promise<Record<string, number>> {
    const costosFijosAmounts: Record<string, number> = this.initializeEmptyPeriods(periods);

    try {
      // Load all costos fijos and filter in frontend
      const response = await getFixedCosts({}, 1, 1000); // Get a large number to include all records
      const allCostosFijos = response.data;

      // Filter and group costos fijos by month, handling recurring payments
      allCostosFijos.forEach(costoFijo => {
        if (costoFijo.start_date && costoFijo.quota_count && costoFijo.quota_value) {
          // Filter by cost center if specified
          if (costCenterId && costoFijo.cost_center_id !== costCenterId) {
            return;
          }

          const startDate = new Date(costoFijo.start_date);
          const quotaCount = Number(costoFijo.quota_count);
          const quotaValue = typeof costoFijo.quota_value === 'string' ? parseFloat(costoFijo.quota_value) : Number(costoFijo.quota_value);

          if (isNaN(quotaValue) || isNaN(quotaCount)) return;

          // Generate all payment months for this costo fijo
          for (let i = 0; i < quotaCount; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(startDate.getMonth() + i);

            const paymentYear = paymentDate.getFullYear();

            // Only process if it's from the selected year
            if (paymentYear === year) {
              const periodId = this.getPeriodIdFromDate(paymentDate, periods);

              if (periodId && costosFijosAmounts.hasOwnProperty(periodId)) {
                costosFijosAmounts[periodId] += quotaValue;
              }
            }
          }
        }
      });

      return costosFijosAmounts;
    } catch (error) {
      console.error('Error loading costos fijos data:', error);
      return this.initializeEmptyPeriods(periods);
    }
  }

  /**
   * Get account categories data aggregated by period using purchase order items
   */
  static async getAccountCategoriesData(periods: FinancialPeriod[], year: number, costCenterId?: number): Promise<CategoryFinancialData> {
    console.log('🚀 Starting getAccountCategoriesData with:', { periods: periods.length, year, costCenterId });
    const categoryData: CategoryFinancialData = {};

    try {
      // Get all active account categories
      console.log('🔄 Loading account categories...');
      const accountCategories = await accountCategoriesService.getActiveCategories();
      console.log('📋 Account categories loaded:', accountCategories);

      if (!accountCategories || accountCategories.length === 0) {
        console.log('⚠️ No active account categories found');
        return categoryData;
      }

      console.log(`✅ Loading data for ${accountCategories.length} account categories`);

      // Process each account category
      for (const category of accountCategories) {
        try {
          const categoryKey = this.generateCategoryKey(category);
          const categoryAmounts = this.initializeEmptyPeriods(periods);

          // Build filters for the current year
          const filters: ItemFilters = {
            date_from: `${year}-01-01`,
            date_to: `${year}-12-31`
          };

          // Get all items for this account category
          let items = await getItemsByAccountCategory(category.id, filters);
          console.log(`Found ${items.length} items for category ${category.name} (ID: ${category.id})`);

          // Apply cost center filter if specified
          if (costCenterId && costCenterId > 0) {
            items = items.filter(item => item.cost_center_id === costCenterId);
          }

          // Group items by period
          items.forEach(item => {
            if (item.date) {
              const itemDate = new Date(item.date);
              const itemYear = itemDate.getFullYear();

              // Only process if it's from the selected year
              if (itemYear === year) {
                const periodId = this.getPeriodIdFromDate(itemDate, periods);

                if (periodId && categoryAmounts.hasOwnProperty(periodId)) {
                  // Ensure we're working with numbers
                  const total = typeof item.total === 'string' ? parseFloat(item.total) : Number(item.total);
                  categoryAmounts[periodId] += isNaN(total) ? 0 : total;
                }
              }
            }
          });

          categoryData[categoryKey] = categoryAmounts;

          console.log(`Loaded data for category ${category.name}: ${Object.values(categoryAmounts).reduce((sum, val) => sum + val, 0)}`);
        } catch (error) {
          console.error(`Error loading data for category ${category.name} (ID: ${category.id}):`, error);
          // Initialize empty data for this category on error
          categoryData[this.generateCategoryKey(category)] = this.initializeEmptyPeriods(periods);
        }
      }

      return categoryData;
    } catch (error) {
      console.error('Error loading account categories data:', error);
      return categoryData;
    }
  }

  /**
   * Generate a consistent key for account categories
   */
  static generateCategoryKey(category: AccountCategory): string {
    // Use a combination of type and name to create a unique, readable key
    const typeKey = category.type.replace('_', '');
    const nameKey = category.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20); // Limit length

    return `${typeKey}_${nameKey}`;
  }

  /**
   * Get human-readable name for a category key
   */
  static getCategoryDisplayName(categoryKey: string, accountCategories: AccountCategory[]): string {
    // Try to find the matching category
    for (const category of accountCategories) {
      if (this.generateCategoryKey(category) === categoryKey) {
        return category.name;
      }
    }

    // Fallback: try to extract readable name from key
    const parts = categoryKey.split('_');
    if (parts.length >= 2) {
      return parts.slice(1).join(' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    return categoryKey;
  }

  /**
   * Get category path for navigation
   */
  static getCategoryPath(categoryKey: string, accountCategories: AccountCategory[]): string {
    // Try to find the matching category
    for (const category of accountCategories) {
      if (this.generateCategoryKey(category) === categoryKey) {
        // Return a path based on category type
        switch (category.type) {
          case AccountCategoryType.MANO_OBRA:
            return '/costos/mano-obra';
          case AccountCategoryType.MAQUINARIA:
            return '/costos/maquinaria';
          case AccountCategoryType.MATERIALES:
            return '/costos/materiales';
          case AccountCategoryType.COMBUSTIBLES:
            return '/costos/combustibles';
          case AccountCategoryType.GASTOS_GENERALES:
            return '/costos/gastos-generales';
          default:
            return '/costos/otros';
        }
      }
    }

    // Fallback path
    return '/costos/categorias';
  }

  /**
   * Get categories grouped by type for better organization
   */
  static async getCategoriesByType(): Promise<Record<AccountCategoryType, AccountCategory[]>> {
    try {
      const grouped = await accountCategoriesService.getGroupedByType();
      return grouped as Record<AccountCategoryType, AccountCategory[]>;
    } catch (error) {
      console.error('Error loading categories by type:', error);
      return {} as Record<AccountCategoryType, AccountCategory[]>;
    }
  }

  /**
   * Initialize empty periods with 0 values
   */
  private static initializeEmptyPeriods(periods: FinancialPeriod[]): Record<string, number> {
    const amounts: Record<string, number> = {};
    periods.forEach(period => {
      amounts[period.id] = 0;
    });
    return amounts;
  }

  /**
   * Get total for a specific financial category across all periods
   */
  static getTotalForCategory(data: Record<string, number>): number {
    return Object.values(data).reduce((sum, amount) => sum + amount, 0);
  }

  /**
   * Get combined totals for all categories (including dynamic account categories)
   */
  static getCombinedTotals(financialData: FinancialDataByPeriod): Record<string, number> {
    const periods = Object.keys(financialData.remuneraciones);
    const totals: Record<string, number> = {};

    periods.forEach(periodId => {
      let periodTotal = 0;

      // Add predefined categories
      periodTotal += financialData.remuneraciones[periodId] || 0;
      periodTotal += financialData.factoring[periodId] || 0;
      periodTotal += financialData.previsionales[periodId] || 0;
      periodTotal += financialData.costosFijos[periodId] || 0;

      // Add dynamic account categories
      Object.keys(financialData).forEach(categoryKey => {
        if (!['remuneraciones', 'factoring', 'previsionales', 'costosFijos'].includes(categoryKey)) {
          const categoryData = financialData[categoryKey];
          if (categoryData && typeof categoryData === 'object') {
            periodTotal += categoryData[periodId] || 0;
          }
        }
      });

      totals[periodId] = periodTotal;
    });

    return totals;
  }

  /**
   * Get grand total across all categories and periods (including dynamic account categories)
   */
  static getGrandTotal(financialData: FinancialDataByPeriod): number {
    let grandTotal = 0;

    // Add predefined categories
    grandTotal += this.getTotalForCategory(financialData.remuneraciones);
    grandTotal += this.getTotalForCategory(financialData.factoring);
    grandTotal += this.getTotalForCategory(financialData.previsionales);
    grandTotal += this.getTotalForCategory(financialData.costosFijos);

    // Add dynamic account categories
    Object.keys(financialData).forEach(categoryKey => {
      if (!['remuneraciones', 'factoring', 'previsionales', 'costosFijos'].includes(categoryKey)) {
        const categoryData = financialData[categoryKey];
        if (categoryData && typeof categoryData === 'object') {
          grandTotal += this.getTotalForCategory(categoryData);
        }
      }
    });

    return grandTotal;
  }

  /**
   * Get all category keys from financial data (predefined + dynamic)
   */
  static getAllCategoryKeys(financialData: FinancialDataByPeriod): string[] {
    const predefinedKeys = ['remuneraciones', 'factoring', 'previsionales', 'costosFijos'];
    const dynamicKeys = Object.keys(financialData).filter(key =>
      !predefinedKeys.includes(key) &&
      typeof financialData[key] === 'object'
    );

    return [...predefinedKeys, ...dynamicKeys];
  }

  /**
   * Helper to convert financial data to FinancialCategory array for the table
   */
  static async convertToFinancialCategories(
    financialData: FinancialDataByPeriod,
    accountCategories?: AccountCategory[]
  ): Promise<Array<{category: string, amounts: Record<string, number>, path: string}>> {
    const categories: Array<{category: string, amounts: Record<string, number>, path: string}> = [];

    // Get account categories if not provided
    if (!accountCategories) {
      try {
        accountCategories = await accountCategoriesService.getActiveCategories();
      } catch (error) {
        console.error('Error loading account categories for conversion:', error);
        accountCategories = [];
      }
    }

    // Process dynamic account categories
    console.log('🔍 Processing financial data keys:', Object.keys(financialData));
    Object.keys(financialData).forEach(categoryKey => {
      console.log(`🔍 Checking category key: ${categoryKey}`);
      if (!['remuneraciones', 'factoring', 'previsionales', 'costosFijos'].includes(categoryKey)) {
        console.log(`✅ Processing dynamic category: ${categoryKey}`);
        const categoryData = financialData[categoryKey];
        if (categoryData && typeof categoryData === 'object') {
          const displayName = this.getCategoryDisplayName(categoryKey, accountCategories!);
          const path = this.getCategoryPath(categoryKey, accountCategories!);
          console.log(`📋 Adding category: ${displayName} with data:`, categoryData);
          categories.push({
            category: displayName,
            amounts: categoryData,
            path: path
          });
        } else {
          console.log(`❌ Category data invalid for ${categoryKey}:`, categoryData);
        }
      }
    });

    return categories;
  }
}

export default FinancialAggregationService;