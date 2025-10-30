// src/pages/CostCenters/CostCentersIndex.tsx
import { useState, useEffect } from 'react';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { getCostCenters, deleteCostCenter, CostCenter } from '../../services/costCenterService';
import Button from '../../components/ui/button/Button';
import CostCenterFormModal from '../../components/CostCenterFormModal';

export default function CostCentersIndex() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCostCenterId, setEditingCostCenterId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadCostCenters();
  }, []);

  const loadCostCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCostCenters();
      setCostCenters(data);
    } catch (err) {
      console.error('Error loading cost centers:', err);
      setError('Error al cargar centros de costo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Está seguro que desea eliminar el centro de costo "${name}"?`)) {
      return;
    }

    try {
      await deleteCostCenter(id);
      // Reload the list after successful deletion
      await loadCostCenters();
    } catch (err) {
      console.error('Error deleting cost center:', err);
      setError('Error al eliminar el centro de costo');
    }
  };

  const handleOpenModal = (costCenterId?: number) => {
    setEditingCostCenterId(costCenterId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCostCenterId(undefined);
  };

  const handleModalSuccess = () => {
    loadCostCenters();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-2 md:p-3 2xl:p-5">
        <div className="flex h-60 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-screen-2xl p-2 md:p-3 2xl:p-5">
        <div className="rounded-sm border border-red-200 bg-red-50 p-4 text-center text-red-500 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400">
          <p>{error}</p>
          <button
            className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
            onClick={loadCostCenters}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-2 md:p-3 2xl:p-5">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-end gap-3">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Centros de Costo
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 pb-0.5">
              · Gestiona los centros de costo de tu organización
            </span>
          </div>
          <Button variant="primary" size="md" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Centro de Costo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Centros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {costCenters.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {costCenters.filter(cc => cc.active).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inactivos</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {costCenters.filter(cc => !cc.active).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
        </div>

        {/* Cost Centers Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/20">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {costCenters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium mb-2">No hay centros de costo</p>
                    <p className="text-sm">Comienza creando tu primer centro de costo</p>
                  </td>
                </tr>
              ) : (
                costCenters.map((cc) => (
                  <tr key={cc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {cc.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {cc.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {cc.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cc.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(cc.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDelete(cc.id, cc.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <CostCenterFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        costCenterId={editingCostCenterId}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
