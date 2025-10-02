// src/services/accountCategoriesService.ts
import { api } from './apiService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Enum for account category types
 */
export enum AccountCategoryType {
  MANO_OBRA = 'mano_obra',
  MAQUINARIA = 'maquinaria',
  MATERIALES = 'materiales',
  COMBUSTIBLES = 'combustibles',
  GASTOS_GENERALES = 'gastos_generales'
}

/**
 * Base AccountCategory interface
 */
export interface AccountCategory {
  id: number;
  code: string; // máx 20 caracteres, único
  name: string; // máx 255 caracteres
  type: AccountCategoryType;
  group_name?: string; // máx 100 caracteres, opcional
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extended interface with usage statistics
 */
export interface AccountCategoryUsage extends AccountCategory {
  usage_count: number;
  total_amount?: number;
}

/**
 * Data for creating a new account category
 */
export interface CreateAccountCategoryData {
  code: string;
  name: string;
  type: AccountCategoryType;
  group_name?: string;
  active?: boolean;
}

/**
 * Data for updating an existing account category
 */
export interface UpdateAccountCategoryData {
  code?: string;
  name?: string;
  type?: AccountCategoryType;
  group_name?: string | null;
  active?: boolean;
}

/**
 * Filters for account categories queries
 */
export interface AccountCategoriesFilters {
  active?: boolean;
  type?: AccountCategoryType;
  group_name?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Response wrapper for paginated results
 */
export interface PaginatedAccountCategoriesResponse {
  data: AccountCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Categories grouped by type
 */
export interface AccountCategoriesGroupedByType {
  [type: string]: AccountCategory[] | undefined;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate account category type
 */
export const isValidAccountCategoryType = (type: string): type is AccountCategoryType => {
  return Object.values(AccountCategoryType).includes(type as AccountCategoryType);
};

/**
 * Validate account category code format
 */
export const validateCategoryCode = (code: string): { valid: boolean; error?: string } => {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'El código es requerido' };
  }

  if (code.length > 20) {
    return { valid: false, error: 'El código no puede exceder 20 caracteres' };
  }

  // Validar formato alfanumérico con guiones y underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
    return { valid: false, error: 'El código solo puede contener letras, números, guiones y underscores' };
  }

  return { valid: true };
};

/**
 * Validate account category name
 */
export const validateCategoryName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'El nombre es requerido' };
  }

  if (name.length > 255) {
    return { valid: false, error: 'El nombre no puede exceder 255 caracteres' };
  }

  return { valid: true };
};

/**
 * Validate group name
 */
export const validateGroupName = (groupName?: string): { valid: boolean; error?: string } => {
  if (!groupName) {
    return { valid: true }; // Optional field
  }

  if (groupName.length > 100) {
    return { valid: false, error: 'El nombre del grupo no puede exceder 100 caracteres' };
  }

  return { valid: true };
};

/**
 * Validate create category data
 */
export const validateCreateCategoryData = (data: CreateAccountCategoryData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const codeValidation = validateCategoryCode(data.code);
  if (!codeValidation.valid) {
    errors.push(codeValidation.error!);
  }

  const nameValidation = validateCategoryName(data.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error!);
  }

  if (!isValidAccountCategoryType(data.type)) {
    errors.push('Tipo de categoría inválido');
  }

  const groupValidation = validateGroupName(data.group_name);
  if (!groupValidation.valid) {
    errors.push(groupValidation.error!);
  }

  return { valid: errors.length === 0, errors };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format account category type for display
 */
export const formatCategoryType = (type: AccountCategoryType): string => {
  const typeLabels: Record<AccountCategoryType, string> = {
    [AccountCategoryType.MANO_OBRA]: 'Mano de Obra',
    [AccountCategoryType.MAQUINARIA]: 'Maquinaria',
    [AccountCategoryType.MATERIALES]: 'Materiales',
    [AccountCategoryType.COMBUSTIBLES]: 'Combustibles',
    [AccountCategoryType.GASTOS_GENERALES]: 'Gastos Generales'
  };

  return typeLabels[type] || type;
};

/**
 * Get category type options for forms
 */
export const getCategoryTypeOptions = () => {
  return Object.values(AccountCategoryType).map(type => ({
    value: type,
    label: formatCategoryType(type)
  }));
};

/**
 * Sort categories by type priority
 */
export const sortCategoriesByTypePriority = (categories: AccountCategory[]): AccountCategory[] => {
  const typePriority: Record<AccountCategoryType, number> = {
    [AccountCategoryType.MANO_OBRA]: 1,
    [AccountCategoryType.MAQUINARIA]: 2,
    [AccountCategoryType.MATERIALES]: 3,
    [AccountCategoryType.COMBUSTIBLES]: 4,
    [AccountCategoryType.GASTOS_GENERALES]: 5
  };

  return [...categories].sort((a, b) => {
    const aPriority = typePriority[a.type] || 999;
    const bPriority = typePriority[b.type] || 999;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Secondary sort by name
    return a.name.localeCompare(b.name);
  });
};

/**
 * Filter categories by search term
 */
export const filterCategoriesBySearch = (categories: AccountCategory[], searchTerm: string): AccountCategory[] => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return categories;
  }

  const term = searchTerm.toLowerCase().trim();

  return categories.filter(category =>
    category.name.toLowerCase().includes(term) ||
    category.code.toLowerCase().includes(term) ||
    (category.group_name && category.group_name.toLowerCase().includes(term)) ||
    formatCategoryType(category.type).toLowerCase().includes(term)
  );
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Account Categories Service
 * Handles all API operations for account categories
 */
class AccountCategoriesService {
  private readonly baseUrl = '/account-categories';

  // Cache for better performance
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Clear cache
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get data from cache if valid
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * Set data in cache
   */
  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Handle API response - extract data from wrapper format
   */
  private handleApiResponse<T>(response: any): T {
    // Handle different response formats from backend
    if (response && typeof response === 'object') {
      // Standard wrapper format: { success: boolean, data: T, message: string }
      if ('data' in response) {
        return response.data;
      }
      // Direct data format
      return response as T;
    }

    return response as T;
  }

  /**
   * Build query string from filters
   */
  private buildQueryString(filters?: AccountCategoriesFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.active !== undefined) {
      params.append('active', filters.active.toString());
    }

    if (filters.type) {
      params.append('type', filters.type);
    }

    if (filters.group_name) {
      params.append('group_name', filters.group_name);
    }

    if (filters.search) {
      params.append('search', filters.search);
    }

    if (filters.page) {
      params.append('page', filters.page.toString());
    }

    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    return params.toString();
  }

  // ========================================================================
  // MAIN CRUD OPERATIONS
  // ========================================================================

  /**
   * Get all account categories with optional filters
   */
  async getAllCategories(filters?: AccountCategoriesFilters): Promise<AccountCategory[]> {
    try {
      const queryString = this.buildQueryString(filters);
      const cacheKey = `all-categories-${queryString}`;

      // Check cache first
      const cached = this.getCachedData<AccountCategory[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
      const response = await api.get<any>(url);

      const categories = this.handleApiResponse<AccountCategory[]>(response);
      const result = Array.isArray(categories) ? categories : [];

      // Cache the result
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error fetching account categories:', error);
      throw error;
    }
  }

  /**
   * Get only active account categories
   */
  async getActiveCategories(): Promise<AccountCategory[]> {
    try {
      const cacheKey = 'active-categories';

      // Check cache first
      const cached = this.getCachedData<AccountCategory[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await api.get<any>(`${this.baseUrl}/active`);
      const categories = this.handleApiResponse<AccountCategory[]>(response);
      const result = Array.isArray(categories) ? categories : [];

      // Cache the result
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error fetching active account categories:', error);
      throw error;
    }
  }

  /**
   * Get categories grouped by type
   */
  async getGroupedByType(): Promise<AccountCategoriesGroupedByType> {
    try {
      const cacheKey = 'grouped-by-type';

      // Check cache first
      const cached = this.getCachedData<AccountCategoriesGroupedByType>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await api.get<any>(`${this.baseUrl}/grouped-by-type`);
      const grouped = this.handleApiResponse<AccountCategoriesGroupedByType>(response);

      // Cache the result
      this.setCachedData(cacheKey, grouped);

      return grouped;
    } catch (error) {
      console.error('Error fetching grouped account categories:', error);
      throw error;
    }
  }

  /**
   * Get categories by specific type
   */
  async getCategoriesByType(type: AccountCategoryType): Promise<AccountCategory[]> {
    try {
      if (!isValidAccountCategoryType(type)) {
        throw new Error(`Tipo de categoría inválido: ${type}`);
      }

      const cacheKey = `categories-by-type-${type}`;

      // Check cache first
      const cached = this.getCachedData<AccountCategory[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await api.get<any>(`${this.baseUrl}/type/${type}`);
      const categories = this.handleApiResponse<AccountCategory[]>(response);
      const result = Array.isArray(categories) ? categories : [];

      // Cache the result
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error) {
      console.error(`Error fetching categories by type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get categories by group name
   */
  async getCategoriesByGroup(groupName: string): Promise<AccountCategory[]> {
    try {
      if (!groupName || groupName.trim().length === 0) {
        throw new Error('Nombre del grupo es requerido');
      }

      const cacheKey = `categories-by-group-${groupName}`;

      // Check cache first
      const cached = this.getCachedData<AccountCategory[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await api.get<any>(`${this.baseUrl}/group/${encodeURIComponent(groupName)}`);
      const categories = this.handleApiResponse<AccountCategory[]>(response);
      const result = Array.isArray(categories) ? categories : [];

      // Cache the result
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error) {
      console.error(`Error fetching categories by group ${groupName}:`, error);
      throw error;
    }
  }

  /**
   * Get account category by code
   */
  async getCategoryByCode(code: string): Promise<AccountCategory> {
    try {
      const validation = validateCategoryCode(code);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const response = await api.get<any>(`${this.baseUrl}/code/${encodeURIComponent(code)}`);
      return this.handleApiResponse<AccountCategory>(response);
    } catch (error) {
      console.error(`Error fetching category by code ${code}:`, error);
      throw error;
    }
  }

  /**
   * Get account category by ID
   */
  async getCategoryById(id: number): Promise<AccountCategory> {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de categoría inválido');
      }

      const response = await api.get<any>(`${this.baseUrl}/${id}`);
      return this.handleApiResponse<AccountCategory>(response);
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new account category
   */
  async createCategory(categoryData: CreateAccountCategoryData): Promise<AccountCategory> {
    try {
      // Validate input data
      const validation = validateCreateCategoryData(categoryData);
      if (!validation.valid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await api.post<any>(this.baseUrl, categoryData);
      const result = this.handleApiResponse<AccountCategory>(response);

      // Clear cache after creation
      this.clearCache();

      return result;
    } catch (error) {
      console.error('Error creating account category:', error);
      throw error;
    }
  }

  /**
   * Update account category
   */
  async updateCategory(id: number, updateData: UpdateAccountCategoryData): Promise<AccountCategory> {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de categoría inválido');
      }

      // Validate update data if present
      if (updateData.code) {
        const codeValidation = validateCategoryCode(updateData.code);
        if (!codeValidation.valid) {
          throw new Error(codeValidation.error);
        }
      }

      if (updateData.name) {
        const nameValidation = validateCategoryName(updateData.name);
        if (!nameValidation.valid) {
          throw new Error(nameValidation.error);
        }
      }

      if (updateData.type && !isValidAccountCategoryType(updateData.type)) {
        throw new Error('Tipo de categoría inválido');
      }

      if (updateData.group_name !== undefined) {
        const groupValidation = validateGroupName(updateData.group_name === null ? undefined : updateData.group_name);
        if (!groupValidation.valid) {
          throw new Error(groupValidation.error!);
        }
      }

      const response = await api.put<any>(`${this.baseUrl}/${id}`, updateData);
      const result = this.handleApiResponse<AccountCategory>(response);

      // Clear cache after update
      this.clearCache();

      return result;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete account category (soft delete)
   */
  async deleteCategory(id: number): Promise<{ message: string }> {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de categoría inválido');
      }

      const response = await api.delete<any>(`${this.baseUrl}/${id}`);
      const result = this.handleApiResponse<{ message: string }>(response);

      // Clear cache after deletion
      this.clearCache();

      return result;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(id: number, active: boolean): Promise<AccountCategory> {
    try {
      return await this.updateCategory(id, { active });
    } catch (error) {
      console.error(`Error toggling category ${id} status:`, error);
      throw error;
    }
  }

  /**
   * Check if category code is available (not used by another category)
   */
  async isCodeAvailable(code: string, excludeId?: number): Promise<boolean> {
    try {
      const validation = validateCategoryCode(code);
      if (!validation.valid) {
        return false;
      }

      try {
        const existing = await this.getCategoryByCode(code);
        // If we found a category with this code
        if (existing) {
          // If we're excluding an ID (updating), check if it's the same category
          return excludeId !== undefined && existing.id === excludeId;
        }
        return true;
      } catch (error) {
        // If we get a 404 error, the code is available
        return true;
      }
    } catch (error) {
      console.error(`Error checking code availability for ${code}:`, error);
      return false;
    }
  }

  /**
   * Get categories with usage statistics
   */
  async getCategoriesUsage(): Promise<AccountCategoryUsage[]> {
    try {
      const cacheKey = 'categories-usage';

      // Check cache first
      const cached = this.getCachedData<AccountCategoryUsage[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await api.get<any>(`${this.baseUrl}/usage`);
      const categories = this.handleApiResponse<AccountCategoryUsage[]>(response);
      const result = Array.isArray(categories) ? categories : [];

      // Cache the result
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error fetching categories usage:', error);
      throw error;
    }
  }

  /**
   * Search categories with advanced filtering
   */
  async searchCategories(searchTerm: string, filters?: Omit<AccountCategoriesFilters, 'search'>): Promise<AccountCategory[]> {
    try {
      const searchFilters: AccountCategoriesFilters = {
        ...filters,
        search: searchTerm
      };

      return await this.getAllCategories(searchFilters);
    } catch (error) {
      console.error(`Error searching categories with term "${searchTerm}":`, error);
      throw error;
    }
  }

  /**
   * Get unique group names from all categories
   */
  async getUniqueGroupNames(): Promise<string[]> {
    try {
      const categories = await this.getAllCategories();
      const groupNames = new Set<string>();

      categories.forEach(category => {
        if (category.group_name && category.group_name.trim().length > 0) {
          groupNames.add(category.group_name.trim());
        }
      });

      return Array.from(groupNames).sort();
    } catch (error) {
      console.error('Error fetching unique group names:', error);
      throw error;
    }
  }

  /**
   * Bulk operations - create multiple categories
   */
  async createMultipleCategories(categoriesData: CreateAccountCategoryData[]): Promise<{
    successful: AccountCategory[];
    failed: { data: CreateAccountCategoryData; error: string }[];
  }> {
    const successful: AccountCategory[] = [];
    const failed: { data: CreateAccountCategoryData; error: string }[] = [];

    for (const categoryData of categoriesData) {
      try {
        const created = await this.createCategory(categoryData);
        successful.push(created);
      } catch (error) {
        failed.push({
          data: categoryData,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Force clear cache (useful for external cache invalidation)
   */
  invalidateCache(): void {
    this.clearCache();
  }
}

// ============================================================================
// EXPORT SERVICE INSTANCE
// ============================================================================

export const accountCategoriesService = new AccountCategoriesService();
export default accountCategoriesService;