// src/components/costs/CostsRealSection.tsx - Versión simplificada solo con tabla
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MultidimensionalCost, 
  CostFilter, 
  CostsSummary, 
  CostsDimensions 
} from '../../services/multidimensionalCostsService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../ui/button/Button';
import Badge from '../ui/badge/Badge';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

interface CostsRealSectionProps {
  projectId: number;
  costs: MultidimensionalCost[];
  summary: CostsSummary | null;
  dimensions: CostsDimensions | null;
  filters: CostFilter;
  loading: boolean;
  onFiltersChange: (filters: CostFilter) => void;
  onRefresh: () => void;
}

const CostsRealSection: React.FC<CostsRealSectionProps> = ({
  projectId,
  costs,
  summary,
  dimensions,
  filters,
  loading,
  onFiltersChange,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando costos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Costos Reales del Proyecto
        </h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
          >
            🔄 Actualizar
          </Button>
          <Link to={`/gastos?cost_center_id=${projectId}`}>
            <Button variant="outline">
              📊 Ver Todos los Costos
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen en cards */}
      {summary && <CostsSummaryCards summary={summary} />}

      {/* Filtros */}
      <CostsFilters 
        filters={filters} 
        dimensions={dimensions}
        onChange={onFiltersChange} 
      />

      {/* Tabla de costos */}
      <CostsTable costs={costs} />
    </div>
  );
};

// ==========================================
// COMPONENTE DE RESUMEN EN CARDS
// ==========================================

interface CostsSummaryCardsProps {
  summary: CostsSummary;
}

const CostsSummaryCards: React.FC<CostsSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total de Costos */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-600 font-medium">Total de Costos</p>
        <p className="text-2xl font-bold text-blue-800">
          {formatCurrency(summary.total_amount)}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {summary.costs_count} registros
        </p>
      </div>

      {/* Ingresos */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <p className="text-sm text-green-600 font-medium">Ingresos</p>
        <p className="text-2xl font-bold text-green-800">
          {formatCurrency(summary.total_income)}
        </p>
        <p className="text-xs text-green-600 mt-1">
          +{summary.total_amount > 0 ? ((summary.total_income / summary.total_amount) * 100).toFixed(1) : 0}%
        </p>
      </div>

      {/* Gastos */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-sm text-red-600 font-medium">Gastos</p>
        <p className="text-2xl font-bold text-red-800">
          {formatCurrency(summary.total_expenses)}
        </p>
        <p className="text-xs text-red-600 mt-1">
          -{summary.total_amount > 0 ? ((summary.total_expenses / summary.total_amount) * 100).toFixed(1) : 0}%
        </p>
      </div>

      {/* Resultado Neto */}
      <div className={`p-4 rounded-lg border ${
        summary.net_result >= 0 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <p className={`text-sm font-medium ${
          summary.net_result >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          Resultado Neto
        </p>
        <p className={`text-2xl font-bold ${
          summary.net_result >= 0 ? 'text-green-800' : 'text-red-800'
        }`}>
          {formatCurrency(summary.net_result)}
        </p>
        <p className={`text-xs mt-1 ${
          summary.net_result >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {summary.net_result >= 0 ? 'Ganancia' : 'Pérdida'}
        </p>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE DE FILTROS
// ==========================================

interface CostsFiltersProps {
  filters: CostFilter;
  dimensions: CostsDimensions | null;
  onChange: (filters: CostFilter) => void;
}

const CostsFilters: React.FC<CostsFiltersProps> = ({ filters, dimensions, onChange }) => {
  const handleFilterChange = (key: keyof CostFilter, value: any) => {
    onChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const clearFilters = () => {
    onChange({});
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-700">Filtros</h4>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          🗑️ Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Tipo de Transacción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={filters.transaction_type || ''}
            onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuenta Contable
          </label>
          <select
            value={filters.category_id || ''}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todas</option>
            {dimensions?.categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.cost_count})
              </option>
            ))}
          </select>
        </div>

        {/* Empleado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empleado
          </label>
          <select
            value={filters.employee_id || ''}
            onChange={(e) => handleFilterChange('employee_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            {dimensions?.employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.cost_count})
              </option>
            ))}
          </select>
        </div>

        {/* Proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proveedor
          </label>
          <select
            value={filters.supplier_id || ''}
            onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            {dimensions?.suppliers.map(sup => (
              <option key={sup.id} value={sup.id}>
                {sup.name} ({sup.cost_count})
              </option>
            ))}
          </select>
        </div>

        {/* Período */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Período
          </label>
          <select
            value={filters.period_key || ''}
            onChange={(e) => handleFilterChange('period_key', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            {dimensions?.periods.map(period => (
              <option key={period.period_key} value={period.period_key}>
                {period.period_key} ({period.cost_count})
              </option>
            ))}
          </select>
        </div>

        {/* Fuente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuente
          </label>
          <select
            value={filters.source_type || ''}
            onChange={(e) => handleFilterChange('source_type', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todas</option>
            {dimensions?.source_types.map(source => (
              <option key={source.source_type} value={source.source_type}>
                {source.source_type} ({source.cost_count})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE DE TABLA
// ==========================================

interface CostsTableProps {
  costs: MultidimensionalCost[];
}

const CostsTable: React.FC<CostsTableProps> = ({ costs }) => {
  if (costs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron costos con los filtros aplicados
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cuenta Contable
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Monto
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fuente
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Relacionado
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {costs.map((cost) => (
            <tr key={cost.cost_id} className="hover:bg-gray-50">
              {/* Cuenta Contable - Clickeable */}
              <td className="px-4 py-4 text-sm text-gray-600">
                <Link
                  to={`/cuentas-contables/${cost.category_id}`}
                  className="block hover:bg-blue-50 p-2 rounded transition-colors"
                >
                  <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                    {cost.category_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {cost.category_group}
                  </div>
                </Link>
              </td>
              
              {/* Descripción */}
              <td className="px-4 py-4 text-sm text-gray-900">
                {cost.description}
              </td>
              
              <td className="px-4 py-4 text-sm text-gray-600">
                {formatDate(cost.date)}
              </td>
              <td className="px-4 py-4 text-sm">
                <Badge
                  color={cost.transaction_type === 'ingreso' ? 'success' : 'error'}
                  variant="light"
                >
                  {cost.transaction_type}
                </Badge>
              </td>
              <td className="px-4 py-4 text-sm font-medium">
                <span className={
                  cost.transaction_type === 'ingreso' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }>
                  {cost.transaction_type === 'ingreso' ? '+' : '-'}
                  {formatCurrency(cost.amount)}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                <Badge variant="light" color="light">
                  {cost.source_type}
                </Badge>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {cost.employee_name && (
                  <div className="text-xs">
                    👤 {cost.employee_name}
                  </div>
                )}
                {cost.supplier_name && (
                  <div className="text-xs">
                    🏢 {cost.supplier_name}
                  </div>
                )}
              </td>
              <td className="px-4 py-4 text-sm">
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.open(`/costs/${cost.cost_id}`, '_blank')}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    👁️ Ver
                  </button>
                  <Link
                    to={`/costs/edit/${cost.cost_id}`}
                    className="text-gray-600 hover:text-gray-800 text-xs"
                  >
                    ✏️ Editar
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CostsRealSection;