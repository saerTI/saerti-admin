import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIngresos } from '../../hooks/useIngresos';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import Label from '../../components/form/Label';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Ingreso, IngresoState, PaymentStatus, IngresoFilter } from '../../types/CC/ingreso';

// Definición de categorías de ingresos con IDs hipotéticos
const INCOME_CATEGORIES = {
  'pagos-clientes': {
    id: 1,
    title: 'Pagos de Clientes',
    description: 'Ingresos por pagos recibidos de clientes por servicios prestados o productos vendidos.',
    icon: '💰'
  },
  'anticipos': {
    id: 2,
    title: 'Anticipos',
    description: 'Pagos recibidos por adelantado antes de la entrega del servicio o producto.',
    icon: '⏰'
  },
  'estados-pago': {
    id: 3,
    title: 'Estados de Pago',
    description: 'Ingresos relacionados con estados de pago de contratos y proyectos.',
    icon: '📄'
  },
  'venta-activos': {
    id: 4,
    title: 'Venta de Activos',
    description: 'Ingresos generados por la venta de activos fijos de la empresa.',
    icon: '🏢'
  },
  'devoluciones': {
    id: 5,
    title: 'Devoluciones',
    description: 'Ingresos por devoluciones de impuestos, garantías u otros conceptos.',
    icon: '↩️'
  },
  'subsidios': {
    id: 6,
    title: 'Subsidios',
    description: 'Ingresos por subsidios gubernamentales o de otras entidades.',
    icon: '🏛️'
  },
  'retorno-inversiones': {
    id: 7,
    title: 'Retorno de Inversiones',
    description: 'Ingresos por dividendos, intereses y otros retornos de inversiones.',
    icon: '📈'
  },
  'otros': {
    id: 8,
    title: 'Otros Ingresos',
    description: 'Ingresos varios que no clasifican en otras categorías.',
    icon: '💼'
  }
};

// Mapping de estados para mostrar en español
const STATE_LABELS: Record<IngresoState, string> = {
  'borrador': 'Borrador',
  'activo': 'Activo',
  'facturado': 'Facturado',
  'pagado': 'Pagado',
  'cancelado': 'Cancelado'
};

// Mapping de estados de pago para mostrar en español
const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  'no_pagado': 'No Pagado',
  'pago_parcial': 'Pago Parcial',
  'pagado': 'Pagado'
};

// Colores para los badges de estado
const STATE_COLORS: Record<IngresoState, string> = {
  'borrador': 'bg-gray-100 text-gray-800',
  'activo': 'bg-blue-100 text-blue-800',
  'facturado': 'bg-yellow-100 text-yellow-800',
  'pagado': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800'
};

// Colores para los badges de estado de pago
const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  'no_pagado': 'bg-red-100 text-red-800',
  'pago_parcial': 'bg-yellow-100 text-yellow-800',
  'pagado': 'bg-green-100 text-green-800'
};

const IngresosCategoryDetail: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  
  // Obtener información de la categoría
  const categoryInfo = category ? INCOME_CATEGORIES[category as keyof typeof INCOME_CATEGORIES] : null;

  // Estado para filtros con categoría inicial
  const [filters, setFilters] = useState<IngresoFilter>({
    search: '',
    state: undefined,
    startDate: '',
    endDate: '',
    categoryId: categoryInfo?.id, // Filtrar por la categoría actual
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortDirection: 'desc'
  });

  const {
    ingresos,
    loading,
    error,
    pagination,
    stats,
    hasData,
    fetchIngresos
  } = useIngresos({
    autoFetch: true,
    initialFilters: filters
  });

  // Efecto para recargar cuando cambien los filtros
  useEffect(() => {
    fetchIngresos(filters);
  }, [filters, fetchIngresos]);

  // Actualizar filtros
  const updateFilters = (newFilters: Partial<IngresoFilter>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset page when filters change
    }));
  };

  // Manejar búsqueda
  const handleSearch = (searchTerm: string) => {
    updateFilters({ search: searchTerm });
  };

  // Manejar cambio de estado
  const handleStateChange = (state: string) => {
    updateFilters({ state: state as IngresoState || undefined });
  };

  // Manejar cambio de fecha
  const handleDateChange = (startDate: string, endDate: string) => {
    updateFilters({ startDate, endDate });
  };

  // Manejar paginación
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Calcular estadísticas de la categoría actual
  const categoryStats = React.useMemo(() => {
    if (!hasData) return { total: 0, totalAmount: 0, count: 0 };
    
    return {
      total: ingresos.length,
      totalAmount: ingresos.reduce((sum: number, ingreso: Ingreso) => sum + ingreso.total_amount, 0),
      count: pagination?.total || ingresos.length
    };
  }, [ingresos, hasData, pagination]);

  if (!categoryInfo) {
    return (
      <div className="w-full px-4 py-6">
        <PageBreadcrumb pageTitle="Categoría no encontrada" />
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.994-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Categoría no encontrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            La categoría "{category}" no existe o no es válida.
          </p>
          <Link
            to="/ingresos"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Ingresos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6">
      <PageBreadcrumb pageTitle={`Ingresos - ${categoryInfo.title}`} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{categoryInfo.icon}</span>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {categoryInfo.title}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            {categoryInfo.description}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/ingresos/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Ingreso
          </Link>

          <Link
            to="/ingresos"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
        </div>
      </div>

      {/* Estadísticas de la categoría */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ComponentCard title="Total de Registros" className="bg-white dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center h-24">
            <p className="text-3xl font-bold text-blue-500">{categoryStats.count}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">ingresos</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Monto Total" className="bg-white dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center h-24">
            <p className="text-2xl font-bold text-green-500">{formatCurrency(categoryStats.totalAmount)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">valor acumulado</p>
          </div>
        </ComponentCard>

        <ComponentCard title="Promedio por Ingreso" className="bg-white dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center h-24">
            <p className="text-2xl font-bold text-purple-500">
              {formatCurrency(categoryStats.count > 0 ? categoryStats.totalAmount / categoryStats.count : 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">promedio</p>
          </div>
        </ComponentCard>
      </div>

      {/* Filtros */}
      <ComponentCard title="Filtros" className="bg-white dark:bg-gray-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              type="text"
              placeholder="Buscar por documento, cliente..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="state">Estado</Label>
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'borrador', label: 'Borrador' },
                { value: 'activo', label: 'Activo' },
                { value: 'facturado', label: 'Facturado' },
                { value: 'pagado', label: 'Pagado' },
                { value: 'cancelado', label: 'Cancelado' }
              ]}
              value={filters.state || ''}
              onChange={handleStateChange}
              placeholder="Seleccionar estado"
            />
          </div>

          <div>
            <Label htmlFor="startDate">Fecha Desde</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange(e.target.value, filters.endDate || '')}
            />
          </div>

          <div>
            <Label htmlFor="endDate">Fecha Hasta</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange(filters.startDate || '', e.target.value)}
            />
          </div>
        </div>
      </ComponentCard>

      {/* Tabla de ingresos */}
      <ComponentCard title="Lista de Ingresos" className="bg-white dark:bg-gray-800">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error al cargar datos</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        ) : !hasData ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay ingresos en esta categoría
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aún no hay ingresos registrados para "{categoryInfo.title}"
            </p>
            <Link
              to="/ingresos/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear Primer Ingreso
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Monto Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {ingresos.map((ingreso: Ingreso) => (
                    <tr key={ingreso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ingreso.document_number}
                        </div>
                        {ingreso.ep_detail && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
                            {ingreso.ep_detail}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ingreso.client_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ingreso.client_tax_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(ingreso.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(ingreso.total_amount)}
                        </div>
                        {ingreso.ep_total !== ingreso.total_amount && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            EP: {formatCurrency(ingreso.ep_total)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATE_COLORS[ingreso.state]}`}>
                          {STATE_LABELS[ingreso.state]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${PAYMENT_STATUS_COLORS[ingreso.payment_status]}`}>
                          {PAYMENT_STATUS_LABELS[ingreso.payment_status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          to={`/ingresos/${ingreso.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Ver
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          to={`/ingresos/editar/${ingreso.id}`}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination && pagination.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {pagination.from} a {pagination.to} de {pagination.total} resultados
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page <= 1}
                    >
                      Anterior
                    </Button>
                    
                    {/* Números de página */}
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={pagination.current_page === page ? "primary" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page >= pagination.total_pages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </ComponentCard>
    </div>
  );
};

export default IngresosCategoryDetail;
