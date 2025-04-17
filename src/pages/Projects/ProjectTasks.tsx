// src/pages/Projects/ProjectTasks.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import projectService from '../../services/projectService';
import { PencilIcon, ChevronLeftIcon, PlusIcon } from '../../icons';
import Button from '../../components/ui/button/Button';
import Alert from '../../components/ui/alert/Alert';
import useGoBack from '../../hooks/useGoBack';
import taskService, { Task, TaskFilter } from '../../services/taskService';

const ProjectTasks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilter>({});
  const navigate = useNavigate();
  const goBack = useGoBack();

  useEffect(() => {
    if (id) {
      loadProjectTasks(parseInt(id));
      loadProjectName(parseInt(id));
    }
  }, [id, filters]);

  const loadProjectTasks = async (projectId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getProjectTasks(projectId, filters);
      setTasks(data);
    } catch (err) {
      setError('Error al cargar las tareas del proyecto. Por favor, intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectName = async (projectId: number) => {
    try {
      const project = await projectService.getProjectById(projectId);
      setProjectName(project.name);
    } catch (err) {
      console.error('Error loading project name:', err);
    }
  };

  // Función para obtener la clase de color según el estado
  const getStateClass = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'done':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Función para obtener la clase de color según la prioridad
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Función para obtener el texto del estado en español
  const getStateText = (state: string) => {
    switch (state) {
      case 'draft': return 'Borrador';
      case 'in_progress': return 'En Progreso';
      case 'done': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return state;
    }
  };

  // Función para obtener el texto de la prioridad en español
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  return (
    <>
      <PageMeta 
        title={`Tareas de ${projectName}`} 
        description={`Lista de tareas del proyecto ${projectName}`} 
      />
      <PageBreadcrumb pageTitle="Tareas del Proyecto" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={goBack}
            className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <div>
            <h2 className="text-title-md2 font-semibold text-black dark:text-white">
              Tareas de {projectName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestión de tareas del proyecto
            </p>
          </div>
        </div>
        <Link to={`/projects/${id}/tasks/new`}>
          <Button 
            size="sm" 
            startIcon={<PlusIcon />}
          >
            Nueva Tarea
          </Button>
        </Link>
      </div>

      {error && (
        <Alert 
          variant="error" 
          title="Error" 
          message={error}
        />
      )}

      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Filtros (futuro) */}
        <div className="mb-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Aquí irán los filtros */}
        </div>

        {/* Tabla de tareas */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">No se encontraron tareas para este proyecto</p>
              <div className="mt-4">
                <Link to={`/projects/${id}/tasks/new`}>
                  <Button size="sm">
                    Crear primera tarea
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Nombre</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Responsable</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Fecha Límite</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Horas Plan.</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Horas Trab.</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Estado</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Prioridad</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <div>
                        <h5 className="font-medium text-black dark:text-white">
                          {task.name}
                        </h5>
                        <p className="text-xs text-gray-500">
                          {task.description.length > 50 
                            ? `${task.description.substring(0, 50)}...`
                            : task.description}
                        </p>
                      </div>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      {task.user_name}
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      {task.date_deadline 
                        ? new Date(task.date_deadline).toLocaleDateString('es-CL')
                        : 'Sin fecha'}
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      {task.planned_hours}
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      {task.effective_hours}
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStateClass(task.state)}`}>
                        {getStateText(task.state)}
                      </span>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getPriorityClass(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </span>
                    </td>
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <div className="flex items-center gap-2">
                        <Link to={`/projects/${id}/tasks/${task.id}`} className="hover:text-brand-500">
                          <svg 
                            className="size-5"
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              d="M12 5C7.52827 5 3.73001 7.94288 2.45898 12C3.73001 16.0571 7.52827 19 12 19C16.4713 19 20.2705 16.0571 21.541 12C20.2705 7.94288 16.4713 5 12 5Z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                            <path 
                              d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                        <Link to={`/projects/${id}/tasks/${task.id}/edit`} className="hover:text-brand-500">
                          <PencilIcon className="size-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectTasks;