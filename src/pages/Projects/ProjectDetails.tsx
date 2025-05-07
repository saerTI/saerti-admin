// src/components/projects/ProjectDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import projectApiService, { ProjectDetail, Milestone, CashFlowLine } from '../../services/projectService';
import Button from '../../components/ui/button/Button';

// Status translation and styling
const PROJECT_STATUS_MAP: Record<string, { label: string, color: string }> = {
  'draft': { label: 'Borrador', color: 'bg-gray-200 text-gray-800' },
  'in_progress': { label: 'En Progreso', color: 'bg-blue-200 text-blue-800' },
  'on_hold': { label: 'En Pausa', color: 'bg-yellow-200 text-yellow-800' },
  'completed': { label: 'Completado', color: 'bg-green-200 text-green-800' },
  'cancelled': { label: 'Cancelado', color: 'bg-red-200 text-red-800' }
};

const ProjectDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'milestones' | 'cashflow'>('info');
  
  // Load project data
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) {
        setError("ID de proyecto no proporcionado");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Asegurarse de convertir el ID a número
        const projectId = parseInt(id);
        if (isNaN(projectId)) {
          throw new Error("ID de proyecto inválido");
        }

        // Verificar que hay datos en la respuesta
        const response = await projectApiService.getProjectById(projectId);
        
        // Si la respuesta es un objeto con propiedad data, extraemos los datos
        const projectData = response && typeof response === 'object' && 'data' in response 
          ? response.data 
          : response;
          
        if (!projectData) {
          throw new Error("No se recibieron datos del proyecto");
        }
        
        setProject(projectData as ProjectDetail);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos del proyecto';
        setError(errorMessage);
        console.error('Error loading project data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL').format(date);
  };
  
  // Handle completing a milestone
  const handleCompleteMilestone = async (milestoneId: number) => {
    if (!project) return;
    
    try {
      await projectApiService.updateMilestone(milestoneId, {
        is_completed: true,
        actual_date: new Date().toISOString().split('T')[0]
      });
      
      // Update the milestone in local state
      const updatedMilestones = project.milestones.map((m: Milestone) => 
        m.id === milestoneId ? { ...m, is_completed: true, actual_date: new Date().toISOString().split('T')[0] } : m
      );
      
      setProject({
        ...project,
        milestones: updatedMilestones
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al completar el hito');
      console.error('Error completing milestone:', err);
    }
  };
  
  // Handle deleting a milestone
  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!project || !confirm('¿Está seguro que desea eliminar este hito? Esta acción no se puede deshacer.')) return;
    
    try {
      await projectApiService.deleteMilestone(milestoneId);
      
      // Update the UI
      const updatedMilestones = project.milestones.filter(m => m.id !== milestoneId);
      
      setProject({
        ...project,
        milestones: updatedMilestones
      });
      
      alert('Hito eliminado');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el hito');
      console.error('Error deleting milestone:', err);
    }
  };
  
  // Handle deleting a cash flow line
  const handleDeleteCashFlowLine = async (lineId: number, type: 'income' | 'expense') => {
    if (!project || !confirm('¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.')) return;
    
    try {
      await projectApiService.deleteCashFlowLine(lineId);
      
      // Update local state
      if (type === 'income') {
        const updatedIncome = project.cash_flow.income.filter((line: CashFlowLine) => line.id !== lineId);
        setProject({
          ...project,
          cash_flow: {
            ...project.cash_flow,
            income: updatedIncome
          }
        });
      } else {
        const updatedExpense = project.cash_flow.expense.filter((line: CashFlowLine) => line.id !== lineId);
        setProject({
          ...project,
          cash_flow: {
            ...project.cash_flow,
            expense: updatedExpense
          }
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el registro');
      console.error('Error deleting cash flow line:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
          <p className="text-gray-700 dark:text-gray-300">{error || 'No se pudo cargar el proyecto'}</p>
          <Button
            className="mt-4 bg-brand-500 hover:bg-brand-600 text-white"
            onClick={() => navigate('/projects')}
          >
            Volver a Proyectos
          </Button>
        </div>
      </div>
    );
  }
  
  // Asegurarse de que todos los campos necesarios existan antes de renderizar
  const safeProject = {
    ...project,
    milestones: project.milestones || [],
    cash_flow: {
      income: project.cash_flow?.income || [],
      expense: project.cash_flow?.expense || []
    },
    progress: project.progress || 0,
    state: project.state || 'draft',
    balance: project.balance || 0,
    total_budget: project.total_budget || 0,
    total_income: project.total_income || 0,
    total_expense: project.total_expense || 0
  };
  
  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header with actions */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {safeProject.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Código: {safeProject.code}</p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
              onClick={() => navigate('/projects')}
            >
              Volver
            </Button>
            <Button
              variant="outline"
              className="border-brand-500 text-brand-500 dark:border-brand-400 dark:text-brand-400"
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              Editar Proyecto
            </Button>
          </div>
        </div>
        
        {/* Project status bar */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
              <div className="mt-2">
                <span className={`px-3 py-1 text-sm rounded-full ${PROJECT_STATUS_MAP[safeProject.state]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {PROJECT_STATUS_MAP[safeProject.state]?.label || safeProject.state}
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Progreso</p>
              <div className="mt-2 flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 dark:bg-gray-700 flex-grow">
                  <div 
                    className="bg-brand-500 h-2.5 rounded-full" 
                    style={{ width: `${safeProject.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{safeProject.progress}%</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Presupuesto</p>
              <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                {formatCurrency(safeProject.total_budget)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
              <p className={`mt-1 text-lg font-semibold ${safeProject.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(safeProject.balance)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'info'
                    ? 'border-b-2 border-brand-500 text-brand-500 dark:text-brand-400 dark:border-brand-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Información General
              </button>
              <button
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'milestones'
                    ? 'border-b-2 border-brand-500 text-brand-500 dark:text-brand-400 dark:border-brand-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('milestones')}
              >
                Hitos ({safeProject.milestones.length})
              </button>
              <button
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'cashflow'
                    ? 'border-b-2 border-brand-500 text-brand-500 dark:text-brand-400 dark:border-brand-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('cashflow')}
              >
                Flujo de Caja
              </button>
            </nav>
          </div>
          
          {/* Tab content */}
          <div className="p-6">
            {/* Info tab */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Detalles del Proyecto</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {safeProject.client?.name || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Inicio</p>
                      <p className="font-medium text-gray-800 dark:text-white">{formatDate(safeProject.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Finalización Esperada</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {formatDate(safeProject.expected_end_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Finalización Real</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {formatDate(safeProject.actual_end_date)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Finanzas</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Presupuesto Total</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {formatCurrency(safeProject.total_budget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Totales</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(safeProject.total_income)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Gastos Totales</p>
                      <p className="font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(safeProject.total_expense)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                      <p className={`font-medium ${safeProject.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(safeProject.balance)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {safeProject.description && (
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Descripción</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{safeProject.description}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Milestones tab - el resto del código permanece igual pero usando safeProject en lugar de project */}
            {activeTab === 'milestones' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Hitos del Proyecto</h3>
                  <Button
                    size="sm"
                    className="bg-brand-500 hover:bg-brand-600 text-white"
                    onClick={() => alert('Agregar hito - Implementar')}
                  >
                    Agregar Hito
                  </Button>
                </div>
                
                {safeProject.milestones.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No hay hitos definidos para este proyecto.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fecha Planeada
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fecha Real
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Monto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        {safeProject.milestones.map((milestone: Milestone) => (
                          <tr key={milestone.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{milestone.name}</div>
                              {milestone.notes && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{milestone.notes}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatDate(milestone.planned_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatDate(milestone.actual_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatCurrency(milestone.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {milestone.is_completed ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Completado
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                {!milestone.is_completed && (
                                  <button
                                    onClick={() => handleCompleteMilestone(milestone.id)}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  >
                                    Completar
                                  </button>
                                )}
                                <button
                                  onClick={() => alert('Editar hito - Implementar')}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteMilestone(milestone.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Cash Flow tab - usa safeProject para garantizar la seguridad */}
            {activeTab === 'cashflow' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Flujo de Caja</h3>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400"
                      onClick={() => alert('Agregar ingreso - Implementar')}
                    >
                      + Ingreso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400"
                      onClick={() => alert('Agregar gasto - Implementar')}
                    >
                      + Gasto
                    </Button>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">Ingresos Totales</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                      {formatCurrency(safeProject.total_income)}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">Gastos Totales</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300">
                      {formatCurrency(safeProject.total_expense)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${safeProject.balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-orange-50 dark:bg-orange-900/30'}`}>
                    <p className={`text-sm ${safeProject.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Balance</p>
                    <p className={`text-xl font-bold ${safeProject.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
                      {formatCurrency(safeProject.balance)}
                    </p>
                  </div>
                </div>
                
                {/* Income */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-green-700 dark:text-green-400 mb-3">Ingresos</h4>
                  {safeProject.cash_flow.income.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-gray-500 dark:text-gray-400">No hay ingresos registrados.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Table header */}
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Descripción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Fecha Planeada
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Fecha Real
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                          {safeProject.cash_flow.income.map((income) => (
                            <tr key={income.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{income.name}</div>
                                {income.notes && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{income.notes}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {income.category?.name || 'No categorizado'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {formatDate(income.planned_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {formatDate(income.actual_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(income.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  income.state === 'realized' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                  {income.state === 'realized' ? 'Realizado' : 'Previsión'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => alert('Editar ingreso - Implementar')}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCashFlowLine(income.id, 'income')}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Expenses */}
                <div>
                  <h4 className="text-md font-medium text-red-700 dark:text-red-400 mb-3">Gastos</h4>
                  {safeProject.cash_flow.expense.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-gray-500 dark:text-gray-400">No hay gastos registrados.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Descripción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Fecha Planeada
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Fecha Real
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                          {safeProject.cash_flow.expense.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{expense.name}</div>
                                {expense.notes && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{expense.notes}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {expense.category?.name || 'No categorizado'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {formatDate(expense.planned_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {formatDate(expense.actual_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                                {formatCurrency(expense.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  expense.state === 'realized' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                  {expense.state === 'realized' ? 'Realizado' : 'Previsión'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => alert('Editar gasto - Implementar')}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCashFlowLine(expense.id, 'expense')}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;