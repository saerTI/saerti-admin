// src/pages/DynamicExpense/ExpenseDataList.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { expenseDataService } from '@/services/expenseDataService';
import { expenseTypeService } from '@/services/expenseTypeService';
import { expenseStatusService } from '@/services/expenseStatusService';
import { expenseCategoryService } from '@/services/expenseCategoryService';
import { getCostCenters, type CostCenter } from '@/services/costCenterService';
import DatePicker from '@/components/form/date-picker';
import type { ExpenseData, ExpenseType, ExpenseFilters, ExpenseStatus, ExpenseCategory } from '@/types/expense';

export default function ExpenseDataList() {
  const { typeName } = useParams<{ typeName?: string }>();

  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [currentType, setCurrentType] = useState<ExpenseType | null>(null);
  const [statuses, setStatuses] = useState<ExpenseStatus[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [formData, setFormData] = useState<Partial<ExpenseData>>({});
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState<ExpenseFilters>({
    expense_type_id: undefined,
    offset: 0,
    limit: 20,
  });

  // Client-side filters (visual only, don't trigger API calls)
  const [clientFilters, setClientFilters] = useState({
    search: '',
    status_id: undefined as number | undefined,
    category_id: undefined as number | undefined,
  });

  // Load expense types first
  useEffect(() => {
    loadExpenseTypes();
  }, []);

  // Update filters when typeName changes
  useEffect(() => {
    if (expenseTypes.length > 0 && typeName) {
      const normalizedTypeName = typeName.replace(/_/g, ' ').toLowerCase();
      const type = expenseTypes.find(t => t.name.toLowerCase() === normalizedTypeName);
      if (type) {
        setCurrentType(type);
        setFilters(prev => ({ ...prev, expense_type_id: type.id, offset: 0 }));
      }
    } else if (!typeName) {
      setCurrentType(null);
      setFilters(prev => ({ ...prev, expense_type_id: undefined, offset: 0 }));
    }
  }, [typeName, expenseTypes]);

  // Load expenses when filters change
  useEffect(() => {
    loadExpenses();
  }, [filters]);

  // Load statuses and categories when type changes
  useEffect(() => {
    if (currentType?.id) {
      loadStatusesAndCategories(currentType.id);
    } else {
      setStatuses([]);
      setCategories([]);
    }
  }, [currentType]);

  // Load cost centers on mount
  useEffect(() => {
    loadCostCenters();
  }, []);


  const loadExpenseTypes = async () => {
    try {
      const types = await expenseTypeService.getAll();
      setExpenseTypes(types);
    } catch (err: any) {
      console.error('Error loading expense types:', err);
    }
  };


  const loadStatusesAndCategories = async (typeId: number) => {
    try {
      const [statusesData, categoriesData] = await Promise.all([
        expenseStatusService.getByType(typeId),
        expenseCategoryService.getByType(typeId)
      ]);
      setStatuses(statusesData.filter(s => s.is_active) as ExpenseStatus[]);
      setCategories(categoriesData.filter(c => c.is_active) as ExpenseCategory[]);
    } catch (err: any) {
      console.error('Error loading statuses/categories:', err);
      setStatuses([]);
      setCategories([]);
    }
  };

  const loadCostCenters = async () => {
    try {
      console.log('🏢 Cargando centros de costo...');
      const response = await getCostCenters();
      console.log('🏢 Respuesta completa:', response);
      // El servicio retorna response.data directamente, pero el backend envuelve en {success, data}
      // El apiService ya extrae response.data, así que response ES el objeto {success, data}
      const centers = Array.isArray(response) ? response : (response as any).data || [];
      console.log('🏢 Centros de costo extraídos:', centers);
      const activeCenters = centers.filter((c: any) => c.active);
      console.log('🏢 Centros de costo activos:', activeCenters);
      setCostCenters(activeCenters);
    } catch (err: any) {
      console.error('❌ Error loading cost centers:', err);
      setCostCenters([]);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await expenseDataService.getAll(filters);
      setExpenses(data || []);
    } catch (err: any) {
      setError(err.message || 'Error cargando egresos');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este egreso?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      await expenseDataService.delete(id);
      await loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Error eliminando egreso');
    } finally {
      setDeleteLoading(null);
    }
  };


  const handleOpenModal = (expense?: ExpenseData) => {
    console.log('🔵 handleOpenModal called with:', expense);
    console.log('🏢 Cost centers disponibles:', costCenters.length);
    if (expense) {
      setEditingExpense(expense);
      setFormData(expense);
    } else {
      setEditingExpense(null);
      setFormData({
        expense_type_id: currentType?.id,
        date: new Date().toISOString().split('T')[0],
        name: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setFormData({});
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentType) {
      alert('No hay tipo de egreso seleccionado');
      return;
    }

    const dataToSend = {
      ...formData,
      expense_type_id: currentType.id
    };

    console.log('📤 Datos a enviar:', dataToSend);

    try {
      setSaving(true);

      if (editingExpense) {
        const updateResult = await expenseDataService.update(editingExpense.id!, formData);
        console.log('✅ Resultado de actualización:', updateResult);
      } else {
        const createResult = await expenseDataService.create(dataToSend);
        console.log('✅ Resultado de creación:', createResult);
      }

      await loadExpenses();
      handleCloseModal();
    } catch (err: any) {
      console.error('❌ Error guardando egreso:', err);
      console.error('❌ Error response:', err.response?.data);
      if (err.response?.data?.errors) {
        console.error('❌ Errores de validación:', JSON.stringify(err.response.data.errors, null, 2));
      }
      const errorMsg = err.response?.data?.errors 
        ? 'Errores de validación: ' + err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
        : err.response?.data?.message || err.message || 'Error guardando egreso';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ExpenseData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (field: keyof ExpenseFilters, value: any) => {
    if (field === 'expense_type_id' && value) {
      const type = expenseTypes.find(t => t.id === Number(value));
      if (type) {
        const slug = type.name.toLowerCase().replace(/\s+/g, '_');
        window.location.href = `/egresos/datos/${slug}`;
      }
    } else if (field === 'expense_type_id' && !value) {
      window.location.href = '/egresos/datos';
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: value,
        offset: 0,
      }));
    }
  };

  const handleClientFilterChange = (field: 'search' | 'status_id' | 'category_id', value: any) => {
    setClientFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearAllFilters = () => {
    setClientFilters({
      search: '',
      status_id: undefined,
      category_id: undefined,
    });
    setFilters(prev => ({
      ...prev,
      date_from: undefined,
      date_to: undefined,
      cost_center_id: undefined,
      offset: 0,
    }));
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL');
  };

  const getStatusInfo = (statusId?: number) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return null;
    return {
      name: status.name,
      color: status.color || '#6B7280'
    };
  };

  const getCategoryInfo = (categoryId?: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;
    return {
      name: category.name,
      color: category.color || '#6B7280'
    };
  };

  const selectedType = currentType;

  // Apply client-side filters
  const filteredExpenses = expenses.filter(expense => {
    // Search filter (name or description)
    if (clientFilters.search) {
      const searchLower = clientFilters.search.toLowerCase();
      const matchName = expense.name?.toLowerCase().includes(searchLower);
      const matchDescription = expense.description?.toLowerCase().includes(searchLower);
      if (!matchName && !matchDescription) return false;
    }

    // Status filter
    if (clientFilters.status_id && expense.status_id !== clientFilters.status_id) {
      return false;
    }

    // Category filter
    if (clientFilters.category_id && expense.category_id !== clientFilters.category_id) {
      return false;
    }

    return true;
  });

  const hasActiveFilters = clientFilters.search || clientFilters.status_id || clientFilters.category_id || filters.date_from || filters.date_to || filters.cost_center_id;

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando egresos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {selectedType ? selectedType.name : 'Datos de Egresos'}
            </h1>
            <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              Egresos
            </span>
          </div>
          {selectedType ? (
            selectedType.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {selectedType.description}
              </p>
            )
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Todos los egresos registrados
            </p>
          )}
        </div>
        {selectedType && (
          <button
            onClick={() => { console.log("Button clicked!"); handleOpenModal(); }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
          >
            + Nuevo Egreso
          </button>
        )}
      </div>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search field */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={clientFilters.search || ''}
              onChange={(e) => handleClientFilterChange('search', e.target.value)}
              placeholder="Nombre o descripción..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status filter - only show if type is selected and has statuses */}
          {selectedType && statuses.length > 0 && (
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={clientFilters.status_id || ''}
                onChange={(e) => handleClientFilterChange('status_id', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category filter - only show if type is selected and has categories */}
          {selectedType && categories.length > 0 && (
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <select
                value={clientFilters.category_id || ''}
                onChange={(e) => handleClientFilterChange('category_id', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date from */}
          <div className="min-w-[160px]">
            <DatePicker
              id="filter-date-from"
              label="Desde"
              placeholder="Seleccionar fecha"
              defaultDate={filters.date_from}
              onChange={(selectedDates) => {
                const date = selectedDates[0];
                handleFilterChange('date_from', date ? date.toISOString().split('T')[0] : '');
              }}
              className="h-[42px]"
            />
          </div>

          {/* Date to */}
          <div className="min-w-[160px]">
            <DatePicker
              id="filter-date-to"
              label="Hasta"
              placeholder="Seleccionar fecha"
              defaultDate={filters.date_to}
              onChange={(selectedDates) => {
                const date = selectedDates[0];
                handleFilterChange('date_to', date ? date.toISOString().split('T')[0] : '');
              }}
              className="h-[42px]"
            />
          </div>

          {/* Cost Center filter */}
          {costCenters.length > 0 && (
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Centro de Costo
              </label>
              <select
                value={filters.cost_center_id || ''}
                onChange={(e) => handleFilterChange('cost_center_id', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="min-w-[140px] px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>



      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {!filters.expense_type_id ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Seleccione un tipo de egreso</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Debe seleccionar un tipo de egreso para ver y crear registros
            </p>
            <div className="mt-6">
              <Link
                to="/egresos/tipos"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ver Tipos de Egresos
              </Link>
            </div>
          </div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {hasActiveFilters ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              )}
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {hasActiveFilters ? 'No se encontraron resultados' : 'No hay egresos registrados'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {hasActiveFilters 
                ? 'Intenta ajustar los filtros para encontrar lo que buscas' 
                : `Comience creando su primer egreso de tipo ${selectedType?.name}`
              }
            </p>
            <div className="mt-6">
              {hasActiveFilters ? (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Limpiar filtros
                </button>
              ) : (
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  + Crear Primer Egreso
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  {selectedType?.show_amount && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Monto
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  {selectedType?.show_category && categories.length > 0 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoría
                    </th>
                  )}
                  {statuses.length > 0 && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                  )}
                  {selectedType?.show_payment_date && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      F. Pago
                    </th>
                  )}
                  {selectedType?.show_reference_number && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ref.
                    </th>
                  )}
                  {selectedType?.show_invoice_number && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Factura
                    </th>
                  )}
                  {selectedType?.show_payment_method && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Método
                    </th>
                  )}
                  {selectedType?.show_payment_status && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado Pago
                    </th>
                  )}
                  {selectedType?.show_currency && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Moneda
                    </th>
                  )}
                  {selectedType?.show_exchange_rate && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      T. Cambio
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {expense.name || '-'}
                      </div>
                    </td>
                    {selectedType?.show_amount && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(expense.date)}
                      </div>
                    </td>
                    {selectedType?.show_category && categories.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const categoryInfo = getCategoryInfo(expense.category_id);
                          if (!categoryInfo) return <span className="text-sm text-gray-500">-</span>;
                          return (
                            <span
                              className="px-3 py-1 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: `${categoryInfo.color}20`,
                                color: categoryInfo.color,
                                border: `1px solid ${categoryInfo.color}40`
                              }}
                            >
                              {categoryInfo.name}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                    {statuses.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const statusInfo = getStatusInfo(expense.status_id);
                          if (!statusInfo) return <span className="text-sm text-gray-500">-</span>;
                          return (
                            <span
                              className="px-3 py-1 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: `${statusInfo.color}20`,
                                color: statusInfo.color,
                                border: `1px solid ${statusInfo.color}40`
                              }}
                            >
                              {statusInfo.name}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                    {selectedType?.show_payment_date && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(expense.payment_date)}
                        </div>
                      </td>
                    )}
                    {selectedType?.show_reference_number && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {expense.reference_number || '-'}
                        </div>
                      </td>
                    )}
                    {selectedType?.show_invoice_number && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {expense.invoice_number || '-'}
                        </div>
                      </td>
                    )}
                    {selectedType?.show_payment_method && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {expense.payment_method || '-'}
                        </span>
                      </td>
                    )}
                    {selectedType?.show_payment_status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          expense.payment_status === 'pagado' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          expense.payment_status === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          expense.payment_status === 'parcial' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {expense.payment_status || '-'}
                        </span>
                      </td>
                    )}
                    {selectedType?.show_currency && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {expense.currency || 'CLP'}
                        </div>
                      </td>
                    )}
                    {selectedType?.show_exchange_rate && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {expense.exchange_rate ? Number(expense.exchange_rate).toFixed(4) : '-'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(expense)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id!)}
                        disabled={deleteLoading === expense.id}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {deleteLoading === expense.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Create/Edit Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingExpense ? 'Editar Egreso' : 'Nuevo Egreso'}
                </h2>
                <button onClick={handleCloseModal} type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre {currentType?.required_name && <span className="text-red-500">*</span>}
                  </label>
                  <input type="text" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required={currentType?.required_name} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                </div>

                {currentType?.show_amount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monto {currentType?.required_amount && <span className="text-red-500">*</span>}
                    </label>
                    <input type="number" value={formData.amount || ''} onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))} required={currentType?.required_amount} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}

                <div>
                  <DatePicker
                    id="modal-date"
                    label={<>Fecha {currentType?.required_date && <span className="text-red-500">*</span>}</>}
                    defaultDate={formData.date || new Date().toISOString().split('T')[0]}
                    onChange={(selectedDates) => {
                      if (selectedDates.length > 0) {
                        const date = selectedDates[0];
                        const formattedDate = date.toISOString().split('T')[0];
                        handleInputChange('date', formattedDate);
                      }
                    }}
                    placeholder="Seleccionar fecha"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Centro de Costo {currentType?.required_cost_center && <span className="text-red-500">*</span>}
                  </label>
                  <select value={formData.cost_center_id || ''} onChange={(e) => handleInputChange('cost_center_id', e.target.value ? Number(e.target.value) : undefined)} required={currentType?.required_cost_center} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white">
                    <option value="">Seleccionar...</option>
                    {costCenters.map((cc) => (<option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>))}
                  </select>
                </div>

                {currentType?.show_category && categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoría {currentType?.required_category && <span className="text-red-500">*</span>}
                    </label>
                    <select value={formData.category_id || ''} onChange={(e) => handleInputChange('category_id', e.target.value ? Number(e.target.value) : undefined)} required={currentType?.required_category} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white">
                      <option value="">Seleccionar...</option>
                      {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                  </div>
                )}

                {statuses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado {currentType?.required_status && <span className="text-red-500">*</span>}
                    </label>
                    <select value={formData.status_id || ''} onChange={(e) => handleInputChange('status_id', e.target.value ? Number(e.target.value) : undefined)} required={currentType?.required_status} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white">
                      <option value="">Seleccionar...</option>
                      {statuses.map((status) => (<option key={status.id} value={status.id}>{status.name}</option>))}
                    </select>
                  </div>
                )}

                {currentType?.show_payment_method && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Método de Pago {currentType?.required_payment_method && <span className="text-red-500">*</span>}
                    </label>
                    <select value={formData.payment_method || ''} onChange={(e) => handleInputChange('payment_method', e.target.value)} required={currentType?.required_payment_method} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white">
                      <option value="">Seleccionar...</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="cheque">Cheque</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                )}

                {currentType?.show_payment_date && (
                  <div>
                    <DatePicker
                      id="modal-payment-date"
                      label={<>Fecha de Pago {currentType?.required_payment_date && <span className="text-red-500">*</span>}</>}
                      defaultDate={formData.payment_date || ''}
                      onChange={(selectedDates) => {
                        if (selectedDates.length > 0) {
                          const date = selectedDates[0];
                          const formattedDate = date.toISOString().split('T')[0];
                          handleInputChange('payment_date', formattedDate);
                        }
                      }}
                      placeholder="Seleccionar fecha de pago"
                    />
                  </div>
                )}

                {currentType?.show_payment_status && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado de Pago {currentType?.required_payment_status && <span className="text-red-500">*</span>}
                    </label>
                    <select value={formData.payment_status || ''} onChange={(e) => handleInputChange('payment_status', e.target.value)} required={currentType?.required_payment_status} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white">
                      <option value="">Seleccionar...</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="parcial">Parcial</option>
                      <option value="pagado">Pagado</option>
                      <option value="anulado">Anulado</option>
                    </select>
                  </div>
                )}

                {currentType?.show_reference_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Referencia {currentType?.required_reference_number && <span className="text-red-500">*</span>}
                    </label>
                    <input type="text" value={formData.reference_number || ''} onChange={(e) => handleInputChange('reference_number', e.target.value)} required={currentType?.required_reference_number} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}

                {currentType?.show_invoice_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Factura {currentType?.required_invoice_number && <span className="text-red-500">*</span>}
                    </label>
                    <input type="text" value={formData.invoice_number || ''} onChange={(e) => handleInputChange('invoice_number', e.target.value)} required={currentType?.required_invoice_number} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}

                {currentType?.show_tax_amount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monto de IVA {currentType?.required_tax_amount && <span className="text-red-500">*</span>}
                    </label>
                    <input type="number" step="0.01" value={formData.tax_amount || ''} onChange={(e) => handleInputChange('tax_amount', parseFloat(e.target.value))} required={currentType?.required_tax_amount} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}

                {currentType?.show_net_amount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monto Neto {currentType?.required_net_amount && <span className="text-red-500">*</span>}
                    </label>
                    <input type="number" step="0.01" value={formData.net_amount || ''} onChange={(e) => handleInputChange('net_amount', parseFloat(e.target.value))} required={currentType?.required_net_amount} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}

                {currentType?.show_total_amount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monto Total {currentType?.required_total_amount && <span className="text-red-500">*</span>}
                    </label>
                    <input type="number" step="0.01" value={formData.total_amount || ''} onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value))} required={currentType?.required_total_amount} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}

                {currentType?.show_currency && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Moneda {currentType?.required_currency && <span className="text-red-500">*</span>}
                    </label>
                    <select value={formData.currency || 'CLP'} onChange={(e) => handleInputChange('currency', e.target.value)} required={currentType?.required_currency} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white">
                      <option value="CLP">Peso Chileno (CLP)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                )}

                {currentType?.show_exchange_rate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Cambio {currentType?.required_exchange_rate && <span className="text-red-500">*</span>}
                    </label>
                    <input type="number" step="0.0001" value={formData.exchange_rate || ''} onChange={(e) => handleInputChange('exchange_rate', parseFloat(e.target.value))} required={currentType?.required_exchange_rate} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : editingExpense ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

