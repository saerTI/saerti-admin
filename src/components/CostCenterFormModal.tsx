// src/components/CostCenterFormModal.tsx
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import {
  getCostCenterById,
  createCostCenter,
  updateCostCenter,
} from '../services/costCenterService';
import { Modal } from './ui/modal';
import Button from './ui/button/Button';
import Label from './form/Label';
import InputField from './form/input/InputField';

interface CostCenterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  costCenterId?: number;
  onSuccess?: () => void;
}

export default function CostCenterFormModal({
  isOpen,
  onClose,
  costCenterId,
  onSuccess
}: CostCenterFormModalProps) {
  const isEditMode = !!costCenterId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    active: true
  });

  useEffect(() => {
    if (isOpen && isEditMode && costCenterId) {
      loadCostCenter();
    } else if (isOpen && !isEditMode) {
      // Reset form when opening for create
      setFormData({
        code: '',
        name: '',
        description: '',
        active: true
      });
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, isEditMode, costCenterId]);

  const loadCostCenter = async () => {
    try {
      setLoading(true);
      const data = await getCostCenterById(costCenterId!);
      setFormData({
        code: data.code,
        name: data.name,
        description: data.description || '',
        active: data.active
      });
    } catch (err) {
      console.error('Error loading cost center:', err);
      setError('Error al cargar el centro de costo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isEditMode && costCenterId) {
        await updateCostCenter(costCenterId, formData);
      } else {
        await createCostCenter(formData);
      }

      setSuccessMessage('Centro de costo guardado exitosamente');

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving cost center:', err);
      setError('Error al guardar el centro de costo');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl" showCloseButton={false}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isEditMode ? 'Actualiza la información del centro de costo' : 'Crea un nuevo centro de costo para organizar gastos e ingresos'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Código */}
                <div>
                  <Label htmlFor="code">
                    Código <span className="text-red-500">*</span>
                  </Label>
                  <InputField
                    id="code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                    placeholder="Ej: CC001"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Código único para identificar el centro de costo
                  </p>
                </div>

                {/* Nombre */}
                <div>
                  <Label htmlFor="name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <InputField
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ej: Administración"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descripción del centro de costo (opcional)"
                  rows={4}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Estado */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    id="active"
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => handleChange('active', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <Label htmlFor="active" className="ml-2 mb-0">
                    Activo
                  </Label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                  Los centros de costo inactivos no aparecerán en las opciones de selección
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Actualizar' : 'Crear'} Centro de Costo
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
