// src/pages/CashFlow/CashFlowForm.tsx
import React, { useState, useEffect } from 'react';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { fetchCashFlowCategories } from './CashFlowData';
import cashFlowService from '../../services/cashFlowService';

// Define the interface for form data
export interface CreateCashFlowItemData {
  date: string;
  description: string;
  categoryId: number;
  amount: number;
  type: 'income' | 'expense';
}

interface CashFlowFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<CreateCashFlowItemData> & { id?: number };
}

const CashFlowForm: React.FC<CashFlowFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateCashFlowItemData>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: 0,
    amount: 0,
    type: 'expense',
  });

  // Load categories and initialize form
  useEffect(() => {
    const init = async () => {
      try {
        const cats = await fetchCashFlowCategories();
        setCategories(cats);
        
        // Initialize with provided data if any
        if (initialData) {
          setFormData({
            date: initialData.date || formData.date,
            description: initialData.description || '',
            categoryId: initialData.categoryId || 0,
            amount: initialData.amount || 0,
            type: initialData.type || 'expense',
          });
        }
      } catch (err) {
        setError('Error al cargar las categorías');
      }
    };
    
    init();
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs separately
    if (type === 'number') {
      setFormData((prev: CreateCashFlowItemData) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev: CreateCashFlowItemData) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.description || !formData.categoryId || !formData.amount) {
        setError('Todos los campos son obligatorios');
        setIsSubmitting(false);
        return;
      }
      
      if (initialData?.id) {
        // Update existing record
        await cashFlowService.updateCashFlowItem(initialData.id, formData);
      } else {
        // Create new record
        await cashFlowService.createCashFlowItem(formData);
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar los datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">
        {initialData?.id ? 'Editar' : 'Nuevo'} Registro de Flujo de Caja
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}
      
      <form id="cashflow-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          
          <div>
            <Label>Descripción</Label>
            <Input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción de la transacción"
              className="w-full"
            />
          </div>
          
          <div>
            <Label>Tipo</Label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>
          
          <div>
            <Label>Categoría</Label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Seleccione una categoría</option>
              {categories
                .filter(cat => cat.type === formData.type)
                .map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          
          <div>
            <Label>Monto</Label>
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step={0.01}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              className="bg-primary text-white"
              disabled={isSubmitting}
              onClick={() => {
                document.getElementById('cashflow-form')?.dispatchEvent(
                  new Event('submit', { cancelable: true, bubbles: true })
                );
              }}
            >
              {isSubmitting ? 'Guardando...' : initialData?.id ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CashFlowForm;