// src/components/incomes/IncomeCategorySelect.tsx
import React, { useEffect, useState } from 'react';
import { useIncomeCategorySelect } from '../../hooks/useIncomeCategorySelect';
import Select from '../form/Select';
import Label from '../form/Label';

interface IncomeCategorySelectProps {
  value?: number | null;
  onChange: (categoryId: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  showLabel?: boolean;
  allowEmpty?: boolean;
}

const IncomeCategorySelect: React.FC<IncomeCategorySelectProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar categoría",
  disabled = false,
  required = false,
  error,
  className = "",
  showLabel = true,
  allowEmpty = true
}) => {
  const { 
    categoryOptions, 
    loading, 
    error: fetchError,
    refetch 
  } = useIncomeCategorySelect();

  // Estado interno para sincronizar con el valor externo
  const [internalValue, setInternalValue] = useState<string>(value ? value.toString() : '');

  // Sincronizar el valor interno cuando cambie el valor externo
  useEffect(() => {
    const newValue = value ? value.toString() : '';
    console.log('🔵 IncomeCategorySelect - value changed:', value, '→', newValue);
    setInternalValue(newValue);
  }, [value]);

  // Sincronizar cuando las opciones se cargan Y hay un valor definido
  useEffect(() => {
    if (value && categoryOptions.length > 0) {
      const valueStr = value.toString();
      const optionExists = categoryOptions.some(option => option.value === valueStr);
      console.log('🔵 IncomeCategorySelect - options loaded, value:', valueStr, 'exists:', optionExists);
      if (optionExists) {
        setInternalValue(valueStr);
      } else {
        console.warn('⚠️ IncomeCategorySelect - value not found:', valueStr, 'available:', categoryOptions.map(o => `${o.value}:${o.label}`));
      }
    } else if (!value && categoryOptions.length > 0) {
      setInternalValue('');
    }
  }, [value, categoryOptions]);

  // Manejar cambios en el select
  const handleSelectChange = (selectedValue: string) => {
    setInternalValue(selectedValue);
    if (selectedValue === '' && allowEmpty) {
      onChange(null);
    } else {
      onChange(parseInt(selectedValue, 10));
    }
  };

  // Retry fetch if there's an error
  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="income-category-select">
      {showLabel && (
        <Label htmlFor="category_id">
          Categoría de Ingreso
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Select
          options={categoryOptions}
          value={internalValue}
          onChange={handleSelectChange}
          placeholder={loading ? 'Cargando...' : placeholder}
          disabled={disabled || loading}
          className={className}
        />

        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Error States */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {fetchError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-red-800">{fetchError}</p>
            <button
              onClick={handleRetry}
              className="text-sm text-red-600 hover:text-red-800 underline"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* No categories available */}
      {!loading && !fetchError && categoryOptions.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">
          No hay categorías disponibles. 
          <button
            onClick={handleRetry}
            className="ml-1 text-blue-600 hover:text-blue-800 underline"
            type="button"
          >
            Actualizar
          </button>
        </p>
      )}
    </div>
  );
};

export default IncomeCategorySelect;
