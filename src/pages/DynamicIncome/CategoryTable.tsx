// src/pages/DynamicIncome/CategoryTable.tsx
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { TrashBinIcon, PlusIcon } from '../../icons';
import { incomeCategoryService, type IncomeCategory } from '../../services/incomeCategoryService';

interface CategoryTableProps {
  incomeTypeId?: number;
}

export interface CategoryTableHandle {
  saveAll: (typeId?: number) => Promise<void>;
}

const CategoryTable = forwardRef<CategoryTableHandle, CategoryTableProps>(({ incomeTypeId }, ref) => {
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🟢 CategoryTable mounted, ref:', ref);
    if (incomeTypeId) {
      loadCategories();
    }
  }, [incomeTypeId]);

  const loadCategories = async () => {
    if (!incomeTypeId) return;

    try {
      setLoading(true);
      const data = await incomeCategoryService.getByType(incomeTypeId);
      setCategories(data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      alert(error.message || 'Error cargando categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    // Add empty row to the list
    const newCategory: IncomeCategory = {
      name: '',
      description: '',
      color: '#6B7280',
    };
    setCategories([...categories, newCategory]);
  };

  const handleDeleteRow = (index: number) => {
    const category = categories[index];

    // If it has an ID, mark it for deletion (we'll handle in saveAll)
    // If it doesn't have an ID, just remove it from the list
    if (!category.id) {
      setCategories(categories.filter((_, i) => i !== index));
    } else {
      // Mark for deletion by removing from list - will be handled in saveAll
      if (confirm('¿Está seguro de eliminar esta categoría?')) {
        setCategories(categories.filter((_, i) => i !== index));
      }
    }
  };

  const handleCategoryChange = (index: number, field: keyof IncomeCategory, value: any) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    setCategories(updatedCategories);
  };

  // Expose saveAll method to parent
  useImperativeHandle(ref, () => ({
    saveAll: async (typeId?: number) => {
      const targetTypeId = typeId || incomeTypeId;
      if (!targetTypeId) {
        throw new Error('Debe guardar el tipo de ingreso primero');
      }

      setLoading(true);
      try {
        // Get currently saved categories from backend
        const savedCategories = await incomeCategoryService.getByType(targetTypeId);

        // Find categories to delete (in savedCategories but not in current categories)
        for (const saved of savedCategories) {
          const stillExists = categories.find(c => c.id === saved.id);
          if (!stillExists && saved.id) {
            await incomeCategoryService.delete(saved.id);
          }
        }

        // Create or update categories
        for (const category of categories) {
          if (!category.name?.trim()) {
            throw new Error('Todas las categorías deben tener un nombre');
          }

          if (category.id) {
            // Update existing
            await incomeCategoryService.update(category.id, category);
          } else {
            // Create new
            const result = await incomeCategoryService.create(targetTypeId, category);
            category.id = result.id;
          }
        }

        await loadCategories();
      } finally {
        setLoading(false);
      }
    }
  }));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Color
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {categories.map((category, index) => (
            <tr key={index} className={!category.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Nombre"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={category.description}
                  onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Descripción"
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => handleCategoryChange(index, 'color', e.target.value)}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{category.color}</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => handleDeleteRow(index)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Eliminar categoría"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}

          {/* Add Row Button */}
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <td colSpan={4} className="px-3 py-2">
              <button
                onClick={handleAddCategory}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full justify-center"
                disabled={loading}
              >
                <PlusIcon className="w-4 h-4" />
                <span>Agregar Categoría</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {categories.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          No hay categorías configuradas. Presiona "Agregar Categoría" para comenzar.
        </div>
      )}
    </div>
  );
});

CategoryTable.displayName = 'CategoryTable';

export default CategoryTable;
