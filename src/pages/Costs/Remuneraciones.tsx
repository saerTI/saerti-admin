import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Remuneracion, RemuneracionCreateData } from '../../types/CC/remuneracion';
import { getRemuneraciones, deleteRemuneracion, createRemuneracion } from '../../services/CC/remuneracionesService';
import NuevaRemuneracionModal from '../../components/CC/NuevaRemuneracionModal';
import { ImportRemuneracionesModal } from '../../components/CC/ImportRemuneracionesModal';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { formatCurrency } from '../../utils/formatters';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import { useCostCenters } from '../../hooks/useCostCenters';

// Status translation and styling
const GASTO_STATUS_MAP: Record<string, { label: string, color: BadgeColor }> = {
  'draft': { label: 'Borrador', color: 'warning' },
  'pending': { label: 'Pendiente', color: 'warning' },
  'pendiente': { label: 'Pendiente', color: 'warning' },
  'approved': { label: 'Aprobado', color: 'success' },
  'aprobado': { label: 'Aprobado', color: 'success' },
  'rejected': { label: 'Rechazado', color: 'error' },
  'rechazado': { label: 'Rechazado', color: 'error' },
  'paid': { label: 'Pagado', color: 'success' },
  'pagado': { label: 'Pagado', color: 'success' },
  'cancelled': { label: 'Cancelado', color: 'error' },
  'cancelado': { label: 'Cancelado', color: 'error' }
};

const Remuneraciones: React.FC = () => {
  const [remuneraciones, setRemuneraciones] = useState<Remuneracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Hook para centros de costo
  const { costCenters } = useCostCenters();

  // Estados para filtros visuales
  const [filters, setFilters] = useState({ 
    cost_center_id: undefined as number | undefined,
    status: '',
    type: ''
  });
  
  // Estado para filtro visual de búsqueda de empleados
  const [employeeSearchFilter, setEmployeeSearchFilter] = useState('');

  const fetchRemuneraciones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRemuneraciones({});
      setRemuneraciones(response); // Cambio aquí: response es directamente un array
      setError(null);
    } catch (err) {
      setError('Error al cargar las remuneraciones.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRemuneraciones();
  }, [fetchRemuneraciones]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleImportSuccess = () => {
    fetchRemuneraciones(); // Recargar datos después de importar
  };

  // Funciones para manejar los filtros
  const handleFilterChange = (key: string, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      cost_center_id: undefined,
      status: '',
      type: ''
    });
    setEmployeeSearchFilter('');
  };

  const handleSave = () => {
    fetchRemuneraciones(); // Recargar datos después de guardar
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta remuneración?')) {
        try {
            await deleteRemuneracion(id);
            fetchRemuneraciones(); // Recargar
        } catch (error) {
            console.error("Error al eliminar", error);
            alert("No se pudo eliminar el registro.");
        }
    }
  };

  // Manejador para crear nueva remuneración
  const handleSubmitRemuneracion = async (formData: RemuneracionCreateData) => {
    try {
      setError(null);
      
      // Llamar al servicio para crear remuneración
      const createdId = await createRemuneracion(formData);
      
      // Cerrar el modal
      handleCloseModal();
      
      // Refrescar los datos
      fetchRemuneraciones();
      
      // Mostrar mensaje de éxito
      alert("Remuneración creada con éxito");
    } catch (err) {
      console.error("Error al crear remuneración:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al crear la remuneración. Por favor, inténtelo de nuevo.";
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  // Función para formatear el periodo como MM/YYYY
  const formatPeriod = (period: string) => {
    if (!period) return 'N/A';
    const [month, year] = period.split('/');
    const formattedMonth = month?.padStart(2, '0') || '00';
    return `${formattedMonth}/${year || '0000'}`;
  };

  // Función para formatear los tipos de remuneración
  const formatRemunerationType = (type: string) => {
    const typeMap = {
      'REMUNERACION': 'Remuneración',
      'ANTICIPO': 'Anticipo',
      'remuneracion': 'Remuneración',
      'anticipo': 'Anticipo'
    };
    
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // Función para filtrar remuneraciones visualmente
  const getFilteredRemuneraciones = () => {
    let filtered = remuneraciones;
    
    // Filtro por empleado (búsqueda de texto)
    if (employeeSearchFilter.trim()) {
      const searchTerm = employeeSearchFilter.toLowerCase().trim();
      filtered = filtered.filter(remuneracion => {
        const employeeName = (remuneracion.employeeName || '').toLowerCase();
        const employeeRut = (remuneracion.employeeRut || '').toLowerCase();
        
        return employeeName.includes(searchTerm) || employeeRut.includes(searchTerm);
      });
    }
    
    // Filtro por centro de costo
    if (filters.cost_center_id) {
      filtered = filtered.filter(remuneracion => 
        remuneracion.projectId === filters.cost_center_id
      );
    }
    
    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(remuneracion => 
        remuneracion.state === filters.status
      );
    }

    // Filtro por tipo
    if (filters.type) {
      filtered = filtered.filter(remuneracion => {
        // Determinar el tipo basado en los valores
        const tipo = (remuneracion.sueldoLiquido && remuneracion.sueldoLiquido > 0) ? 'REMUNERACION' : 'ANTICIPO';
        return tipo === filters.type;
      });
    }
    
    return filtered;
  };

  // Función para verificar si hay filtros activos
  const hasActiveFilters = () => {
    return employeeSearchFilter.trim() || filters.cost_center_id || filters.status || filters.type;
  };

  // Función para obtener el mensaje de filtros
  const getNoResultsMessage = () => {
    const activeFilters = [];
    
    if (employeeSearchFilter.trim()) {
      activeFilters.push(`empleado "${employeeSearchFilter}"`);
    }
    
    if (filters.cost_center_id) {
      const centerName = costCenters.find(c => c.id === filters.cost_center_id)?.name;
      activeFilters.push(`centro de costo "${centerName}"`);
    }
    
    if (filters.status) {
      const statusLabel = GASTO_STATUS_MAP[filters.status]?.label || filters.status;
      activeFilters.push(`estado "${statusLabel}"`);
    }

    if (filters.type) {
      activeFilters.push(`tipo "${formatRemunerationType(filters.type)}"`);
    }
    
    if (activeFilters.length === 0) return "No se encontraron registros";
    
    if (activeFilters.length === 1) {
      return `No se encontraron registros para ${activeFilters[0]}.`;
    } else if (activeFilters.length === 2) {
      return `No se encontraron registros para ${activeFilters[0]} y ${activeFilters[1]}.`;
    } else {
      return `No se encontraron registros para ${activeFilters.slice(0, -1).join(', ')} y ${activeFilters[activeFilters.length - 1]}.`;
    }
  };

  // Función para obtener el badge según el estado
  const getStatusBadge = (status: string) => {
    const config = GASTO_STATUS_MAP[status] || { color: 'warning' as const, label: status };
    
    return <Badge variant="light" color={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <PageBreadcrumb 
        pageTitle="Remuneraciones" 
        items={[
          { label: 'Costos', path: '/costos' },
          { label: 'Remuneraciones', path: '/costos/remuneraciones' }
        ]} 
      />

      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Remuneraciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las remuneraciones y anticipos de empleados
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={handleOpenImportModal}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Importar Datos
          </Button>
          <Button
            onClick={handleOpenModal}
            className="w-full sm:w-auto"
          >
            Nueva Remuneración
          </Button>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <ComponentCard title="Filtros" compact>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          {/* Búsqueda por empleado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Empleado (RUT o Nombre)
            </label>
            <input
              type="text"
              placeholder="Ej: 12345678-9 o Juan Pérez"
              value={employeeSearchFilter}
              onChange={(e) => setEmployeeSearchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          {/* Centro de costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Centro de Costo
            </label>
            <select
              value={filters.cost_center_id || ''}
              onChange={(e) => handleFilterChange('cost_center_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos los centros</option>
              {costCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="pagado">Pagado</option>
              <option value="rechazado">Rechazado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="REMUNERACION">Remuneración</option>
              <option value="ANTICIPO">Anticipo</option>
            </select>
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full sm:w-auto"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </ComponentCard>

      {/* Estados de carga y error */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && remuneraciones.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 13h3a3 3 0 0 0 0-6H7a1 1 0 0 1 0-2h9a1 1 0 0 1 0 2 1 1 0 0 0 0 2H7a3 3 0 0 0 0 6h9a1 1 0 0 1 0 2 1 1 0 0 0 0 2H7a5 5 0 0 1 0-10h9a5 5 0 0 1 0 10z"/>
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay remuneraciones</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comienza agregando una nueva remuneración.</p>
          <div className="mt-6">
            <Button onClick={handleOpenModal}>
              Agregar Primera Remuneración
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && remuneraciones.length > 0 && getFilteredRemuneraciones().length === 0 && hasActiveFilters() && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No se encontraron registros</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {getNoResultsMessage()}
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Tabla sin card */}
      {!loading && !error && remuneraciones.length > 0 && getFilteredRemuneraciones().length > 0 && (
        <div className="w-full overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Empleado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Centro de Costo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Periodo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Remuneración
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Anticipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {getFilteredRemuneraciones().map((remuneracion) => {
                // Determinar el tipo basado en los valores
                const tipo = (remuneracion.sueldoLiquido && remuneracion.sueldoLiquido > 0) ? 'REMUNERACION' : 'ANTICIPO';
                
                return (
                  <tr key={remuneracion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {remuneracion.employeeName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {remuneracion.employeeRut}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        {remuneracion.projectCode && (
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-500">
                            {remuneracion.projectCode}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 truncate max-w-[150px]">
                          {remuneracion.projectName || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatPeriod(remuneracion.period)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatRemunerationType(tipo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {remuneracion.sueldoLiquido && remuneracion.sueldoLiquido > 0 
                        ? formatCurrency(remuneracion.sueldoLiquido) 
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {remuneracion.anticipo && remuneracion.anticipo > 0 
                        ? formatCurrency(remuneracion.anticipo) 
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(remuneracion.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(remuneracion.state)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/gastos/remuneraciones/${remuneracion.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(remuneracion.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal del formulario */}
      {isModalOpen && (
        <NuevaRemuneracionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitRemuneracion}
          projects={[]} // Temporal hasta que se implemente proyectos
        />
      )}

      {/* Modal de importación */}
      <ImportRemuneracionesModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default Remuneraciones;