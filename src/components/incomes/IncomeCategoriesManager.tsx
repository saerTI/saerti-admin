// src/components/incomes/IncomeCategoriesManager.tsx
import React, { useState, useCallback } from 'react';
import { 
  useIncomeCategories, 
  useActiveIncomeCategories,
  useCategoriesUsage 
} from '../../hooks/useIncomeCategories';
import { 
  IncomeCategory, 
  CreateIncomeCategoryData, 
  UpdateIncomeCategoryData 
} from '../../services/incomeCategoriesService';

interface IncomeCategoriesManagerProps {
  onCategorySelect?: (category: IncomeCategory) => void;
  showUsageStats?: boolean;
}

const IncomeCategoriesManager: React.FC<IncomeCategoriesManagerProps> = ({
  onCategorySelect,
  showUsageStats = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IncomeCategory | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Hooks para gestión de categorías
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    refreshCategories,
    clearError
  } = useIncomeCategories({
    search: searchTerm,
    active: showInactive ? undefined : true
  });

  const {
    categoriesUsage,
    loading: usageLoading,
    refreshCategoriesUsage
  } = useCategoriesUsage();

  // Estado para formularios
  const [newCategoryData, setNewCategoryData] = useState<CreateIncomeCategoryData>({
    categoria: '',
    active: true
  });

  const [editCategoryData, setEditCategoryData] = useState<UpdateIncomeCategoryData>({});

  // Handlers
  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryData.categoria.trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    const result = await createCategory(newCategoryData);
    if (result) {
      setNewCategoryData({ categoria: '', active: true });
      setShowCreateForm(false);
      if (showUsageStats) {
        refreshCategoriesUsage();
      }
    }
  }, [newCategoryData, createCategory, showUsageStats, refreshCategoriesUsage]);

  const handleUpdateCategory = useCallback(async () => {
    if (!editingCategory) return;

    const result = await updateCategory(editingCategory.id, editCategoryData);
    if (result) {
      setEditingCategory(null);
      setEditCategoryData({});
      if (showUsageStats) {
        refreshCategoriesUsage();
      }
    }
  }, [editingCategory, editCategoryData, updateCategory, showUsageStats, refreshCategoriesUsage]);

  const handleDeleteCategory = useCallback(async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta categoría?')) {
      const result = await deleteCategory(id);
      if (result && showUsageStats) {
        refreshCategoriesUsage();
      }
    }
  }, [deleteCategory, showUsageStats, refreshCategoriesUsage]);

  const handleToggleStatus = useCallback(async (id: number, currentActive: boolean) => {
    const result = await toggleCategoryStatus(id, !currentActive);
    if (result && showUsageStats) {
      refreshCategoriesUsage();
    }
  }, [toggleCategoryStatus, showUsageStats, refreshCategoriesUsage]);

  const handleEditClick = useCallback((category: IncomeCategory) => {
    setEditingCategory(category);
    setEditCategoryData({
      categoria: category.categoria,
      active: category.active
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null);
    setEditCategoryData({});
  }, []);

  const displayCategories = showUsageStats ? categoriesUsage : categories;
  const isLoading = categoriesLoading || (showUsageStats && usageLoading);

  return (
    <div className="income-categories-manager">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Categorías de Ingresos
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
          disabled={isLoading}
        >
          + Nueva Categoría
        </button>
      </div>

      {/* Error Display */}
      {categoriesError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{categoriesError}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar categoría
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="input w-full"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="mr-2"
              />
              Mostrar categorías inactivas
            </label>
          </div>

          {showUsageStats && (
            <div className="flex items-center">
              <button
                onClick={() => {
                  refreshCategories();
                  refreshCategoriesUsage();
                }}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                🔄 Actualizar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Nueva Categoría</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la categoría *
                </label>
                <input
                  type="text"
                  value={newCategoryData.categoria}
                  onChange={(e) => setNewCategoryData({
                    ...newCategoryData,
                    categoria: e.target.value
                  })}
                  placeholder="Ej: Servicios de construcción"
                  className="input w-full"
                  maxLength={100}
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCategoryData.active}
                    onChange={(e) => setNewCategoryData({
                      ...newCategoryData,
                      active: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Categoría activa
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCategoryData({ categoria: '', active: true });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCategory}
                className="btn btn-primary"
                disabled={!newCategoryData.categoria.trim() || isLoading}
              >
                {isLoading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando categorías...</p>
          </div>
        ) : displayCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron categorías
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  {showUsageStats && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingresos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Total
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {category.categoria}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    {showUsageStats && 'income_count' in category && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(category as any).income_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${((category as any).total_amount || 0).toLocaleString()}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {onCategorySelect && (
                          <button
                            onClick={() => onCategorySelect(category)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Seleccionar"
                          >
                            Seleccionar
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(category)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(category.id, category.active)}
                          className={category.active 
                            ? "text-red-600 hover:text-red-900" 
                            : "text-green-600 hover:text-green-900"
                          }
                          title={category.active ? "Desactivar" : "Activar"}
                        >
                          {category.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Editar Categoría: {editingCategory.categoria}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la categoría *
                </label>
                <input
                  type="text"
                  value={editCategoryData.categoria || ''}
                  onChange={(e) => setEditCategoryData({
                    ...editCategoryData,
                    categoria: e.target.value
                  })}
                  className="input w-full"
                  maxLength={100}
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editCategoryData.active ?? true}
                    onChange={(e) => setEditCategoryData({
                      ...editCategoryData,
                      active: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Categoría activa
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateCategory}
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeCategoriesManager;
