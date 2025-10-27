// src/pages/DynamicIncome/StatusTable.tsx
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { TrashBinIcon, PlusIcon } from '../../icons';
import { incomeStatusService, type IncomeStatus } from '../../services/incomeStatusService';

interface StatusTableProps {
  incomeTypeId?: number;
}

export interface StatusTableHandle {
  saveAll: (typeId?: number) => Promise<void>;
}

const StatusTable = forwardRef<StatusTableHandle, StatusTableProps>(({ incomeTypeId }, ref) => {
  const [statuses, setStatuses] = useState<IncomeStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🟢 StatusTable mounted, ref:', ref);
    if (incomeTypeId) {
      loadStatuses();
    }
  }, [incomeTypeId]);

  const loadStatuses = async () => {
    if (!incomeTypeId) return;

    try {
      setLoading(true);
      const data = await incomeStatusService.getByType(incomeTypeId);
      setStatuses(data);
    } catch (error: any) {
      console.error('Error loading statuses:', error);
      alert(error.message || 'Error cargando estados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = () => {
    // Add empty row to the list
    const newStatus: IncomeStatus = {
      name: '',
      description: '',
      color: '#6B7280',
      is_final: false,
    };
    setStatuses([...statuses, newStatus]);
  };

  const handleDeleteRow = (index: number) => {
    const status = statuses[index];

    // If it has an ID, mark it for deletion (we'll handle in saveAll)
    // If it doesn't have an ID, just remove it from the list
    if (!status.id) {
      setStatuses(statuses.filter((_, i) => i !== index));
    } else {
      // Mark for deletion by removing from list - will be handled in saveAll
      if (confirm('¿Está seguro de eliminar este estado?')) {
        setStatuses(statuses.filter((_, i) => i !== index));
      }
    }
  };

  const handleStatusChange = (index: number, field: keyof IncomeStatus, value: any) => {
    const updatedStatuses = [...statuses];
    updatedStatuses[index] = { ...updatedStatuses[index], [field]: value };
    setStatuses(updatedStatuses);
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
        // Get currently saved statuses from backend
        const savedStatuses = await incomeStatusService.getByType(targetTypeId);

        // Find statuses to delete (in savedStatuses but not in current statuses)
        for (const saved of savedStatuses) {
          const stillExists = statuses.find(s => s.id === saved.id);
          if (!stillExists && saved.id) {
            await incomeStatusService.delete(saved.id);
          }
        }

        // Create or update statuses
        for (const status of statuses) {
          if (!status.name?.trim()) {
            throw new Error('Todos los estados deben tener un nombre');
          }

          if (status.id) {
            // Update existing
            await incomeStatusService.update(status.id, status);
          } else {
            // Create new
            const result = await incomeStatusService.create(targetTypeId, status);
            status.id = result.id;
          }
        }

        await loadStatuses();
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
              Final
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {statuses.map((status, index) => (
            <tr key={index} className={!status.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={status.name}
                  onChange={(e) => handleStatusChange(index, 'name', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Nombre"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={status.description}
                  onChange={(e) => handleStatusChange(index, 'description', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Descripción"
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={status.color}
                    onChange={(e) => handleStatusChange(index, 'color', e.target.value)}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{status.color}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={status.is_final}
                  onChange={(e) => handleStatusChange(index, 'is_final', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => handleDeleteRow(index)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Eliminar estado"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}

          {/* Add Row Button */}
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <td colSpan={5} className="px-3 py-2">
              <button
                onClick={handleAddStatus}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full justify-center"
                disabled={loading}
              >
                <PlusIcon className="w-4 h-4" />
                <span>Agregar Estado</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {statuses.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          No hay estados configurados. Presiona "Agregar Estado" para comenzar.
        </div>
      )}
    </div>
  );
});

StatusTable.displayName = 'StatusTable';

export default StatusTable;
