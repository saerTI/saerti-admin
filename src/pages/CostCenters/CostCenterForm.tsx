// src/pages/CostCenters/CostCenterForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import {
  getCostCenterById,
  createCostCenter,
  updateCostCenter,
  CostCenter
} from '../../services/costCenterService';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Button from '../../components/ui/button/Button';
import Label from '../../components/form/Label';
import InputField from '../../components/form/input/InputField';

export default function CostCenterForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    active: true
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadCostCenter(parseInt(id));
    }
  }, [id, isEditMode]);

  const loadCostCenter = async (costCenterId: number) => {
    try {
      setLoading(true);
      const data = await getCostCenterById(costCenterId);
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

    try {
      if (isEditMode && id) {
        // Update existing cost center
        await updateCostCenter(parseInt(id), formData);
      } else {
        // Create new cost center
        await createCostCenter(formData);
      }

      // Navigate back to list
      navigate('/centros-costo');
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

  if (loading) {
    return (
      <div className="w-full px-4 py-6">
        <PageBreadcrumb pageTitle={isEditMode ? "Editar Centro de Costo" : "Nuevo Centro de Costo"} titleSize="2xl" />
        <div className="flex h-60 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <PageBreadcrumb
          pageTitle={isEditMode ? "Editar Centro de Costo" : "Nuevo Centro de Costo"}
          titleSize="2xl"
        />
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/centros-costo')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-sm border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
              onClick={() => navigate('/centros-costo')}
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
      </div>
    </div>
  );
}
