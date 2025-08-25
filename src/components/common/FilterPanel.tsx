// src/components/common/FilterPanel.tsx - Con tipos corregidos

import { ReactNode, useMemo } from 'react';
import ComponentCard from './ComponentCard';
import Select from '../form/Select';
import Label from '../form/Label';
import DatePicker from '../form/date-picker';
import Button from '../ui/button/Button';

export interface FilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'daterange' | 'search';
  options?: FilterOption[] | (() => FilterOption[]); // ✅ CORREGIDO: Permitir funciones
  placeholder?: string;
  disabled?: boolean;
  width?: 'sm' | 'md' | 'lg' | 'full';
  loading?: boolean; // ✅ AÑADIDO: Estado de carga para filtros específicos
  dependencies?: string[]; // ✅ AÑADIDO: Dependencias de otros filtros
  conditionalRender?: (filters: Record<string, any>) => boolean; // ✅ AÑADIDO: Renderizado condicional
}

export interface FilterPanelProps {
  title?: string;
  filters: Record<string, any>;
  filterConfigs: FilterConfig[];
  onFilterChange: (filterKey: string, value: string) => void;
  onClearFilters: () => void;
  showClearButton?: boolean;
  children?: ReactNode;
  className?: string;
  loading?: boolean; // ✅ AÑADIDO: Estado de carga general
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  title = "Filtros",
  filters,
  filterConfigs,
  onFilterChange,
  onClearFilters,
  showClearButton = true,
  children,
  className = "",
  loading = false
}) => {
  // ✅ MEJORADO: Calcular filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => 
      filters[key] !== undefined && 
      filters[key] !== '' && 
      filters[key] !== null
    );
  }, [filters]);

  // ✅ MEJORADO: Filtrar configuraciones según condiciones
  const visibleConfigs = useMemo(() => {
    return filterConfigs.filter(config => {
      if (config.conditionalRender) {
        return config.conditionalRender(filters);
      }
      return true;
    });
  }, [filterConfigs, filters]);

  // ✅ MEJORADO: Calcular columnas dinámicamente
  const getColumnClass = (configs: FilterConfig[]) => {
    const count = configs.length;
    if (count <= 2) return 'md:grid-cols-2';
    if (count <= 3) return 'md:grid-cols-3';
    if (count <= 4) return 'md:grid-cols-4';
    if (count <= 5) return 'md:grid-cols-5';
    return 'md:grid-cols-6';
  };

  // ✅ MEJORADO: Resolver opciones dinámicas
  const resolveOptions = (config: FilterConfig): FilterOption[] => {
    if (!config.options) return [];
    
    if (typeof config.options === 'function') {
      try {
        return config.options();
      } catch (error) {
        console.error(`Error resolving options for filter ${config.key}:`, error);
        return [];
      }
    }
    
    return config.options;
  };

  const renderFilter = (config: FilterConfig) => {
    const currentValue = filters[config.key] || '';
    const isDisabled = config.disabled || loading || config.loading;

    switch (config.type) {
      case 'select':
        const options = resolveOptions(config);
        
        return (
          <div key={config.key} className={getWidthClass(config.width)}>
            <Label htmlFor={config.key}>
              {config.label}
              {config.loading && (
                <span className="ml-2 inline-flex items-center">
                  <svg className="animate-spin h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </Label>
            <Select
              options={options}
              defaultValue={currentValue}
              onChange={(value) => onFilterChange(config.key, value)}
              placeholder={config.placeholder || `Seleccione ${config.label.toLowerCase()}`}
              disabled={isDisabled}
            />
          </div>
        );

      case 'date':
        return (
          <div key={config.key} className={getWidthClass(config.width)}>
            <DatePicker
              id={config.key}
              label={config.label}
              placeholder={config.placeholder || `Seleccione ${config.label.toLowerCase()}`}
              defaultDate={currentValue || undefined}
              onChange={(selectedDates, dateStr) => {
                onFilterChange(config.key, dateStr);
              }}
              disabled={isDisabled}
            />
          </div>
        );

      case 'search':
        return (
          <div key={config.key} className={getWidthClass(config.width)}>
            <Label htmlFor={config.key}>{config.label}</Label>
            <div className="relative">
              <input
                id={config.key}
                type="text"
                value={currentValue}
                onChange={(e) => onFilterChange(config.key, e.target.value)}
                placeholder={config.placeholder || `Buscar ${config.label.toLowerCase()}...`}
                disabled={isDisabled}
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-10 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800 ${
                  isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getWidthClass = (width?: string) => {
    switch (width) {
      case 'sm': return 'md:col-span-1';
      case 'lg': return 'md:col-span-2';
      case 'full': return 'col-span-full';
      default: return 'md:col-span-1';
    }
  };

  // ✅ MEJORADO: Renderizado con skeleton si está cargando
  if (loading) {
    return (
      <ComponentCard title={title} className={className}>
        <div className={`grid grid-cols-1 ${getColumnClass(filterConfigs)} gap-4`}>
          {filterConfigs.map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard title={title} className={className}>
      <div className={`grid grid-cols-1 ${getColumnClass(visibleConfigs)} gap-4`}>
        {visibleConfigs.map(renderFilter)}
        {children}
      </div>

      {/* ✅ MEJORADO: Información de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Object.keys(filters).length} filtro{Object.keys(filters).length !== 1 ? 's' : ''} aplicado{Object.keys(filters).length !== 1 ? 's' : ''}
          </div>
          
          {showClearButton && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearFilters}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </ComponentCard>
  );
};

export default FilterPanel;