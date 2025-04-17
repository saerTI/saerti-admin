// src/services/taskService.ts
import odooAPI from './odooService';

// Tipos para los datos de Tareas
export interface Task {
  id: number;
  name: string;
  description: string;
  project_id: number;
  project_name?: string;
  user_id: number;
  user_name?: string;
  planned_hours: number;
  effective_hours: number;
  date_deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  state: 'draft' | 'in_progress' | 'done' | 'cancelled';
  sequence: number;
  color?: number;
}

export type TaskCreateData = Omit<Task, 'id' | 'project_name' | 'user_name' | 'effective_hours'>;
export type TaskUpdateData = Partial<TaskCreateData>;

// Opciones para filtrar tareas
export interface TaskFilter {
  project_id?: number;
  user_id?: number;
  state?: string[];
  priority?: string[];
  search?: string;
}

// Servicio para manejar operaciones de tareas
const taskService = {
  /**
   * Obtener todas las tareas de un proyecto
   */
  async getProjectTasks(projectId: number, filters: TaskFilter = {}): Promise<Task[]> {
    try {
      // Construir el dominio (filtros) para Odoo
      const domain: any[] = [
        ['project_id', '=', projectId]
      ];
      
      if (filters.user_id) {
        domain.push(['user_id', '=', filters.user_id]);
      }
      
      if (filters.state && filters.state.length > 0) {
        domain.push(['state', 'in', filters.state]);
      }
      
      if (filters.priority && filters.priority.length > 0) {
        domain.push(['priority', 'in', filters.priority]);
      }
      
      if (filters.search) {
        domain.push('|', ['name', 'ilike', filters.search], ['description', 'ilike', filters.search]);
      }
      
      // Llamar a la API de Odoo
      try {
        const tasks = await odooAPI.searchRead(
          'project.task',  // Modelo de Odoo para tareas
          domain,
          [
            'id', 'name', 'description', 'project_id', 'user_id', 
            'planned_hours', 'effective_hours', 'date_deadline', 
            'priority', 'state', 'sequence', 'color'
          ]
        );
        
        // Procesar los resultados para adaptarlos a nuestro formato
        return tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description || '',
          project_id: task.project_id && task.project_id[0],
          project_name: task.project_id && task.project_id[1],
          user_id: task.user_id && task.user_id[0],
          user_name: task.user_id && task.user_id[1],
          planned_hours: task.planned_hours || 0,
          effective_hours: task.effective_hours || 0,
          date_deadline: task.date_deadline || '',
          priority: task.priority || 'medium',
          state: task.state || 'draft',
          sequence: task.sequence || 0,
          color: task.color
        }));
      } catch (error) {
        console.error('Error fetching tasks from Odoo:', error);
        // Para desarrollo, retornar datos simulados
        return getMockTasks(projectId);
      }
    } catch (error) {
      console.error('Error en getProjectTasks:', error);
      throw new Error('No se pudieron cargar las tareas del proyecto');
    }
  },

  /**
   * Obtener una tarea por ID
   */
  async getTaskById(id: number): Promise<Task> {
    try {
      const tasks = await odooAPI.read(
        'project.task',
        [id],
        [
          'id', 'name', 'description', 'project_id', 'user_id', 
          'planned_hours', 'effective_hours', 'date_deadline', 
          'priority', 'state', 'sequence', 'color'
        ]
      );
      
      if (!tasks || tasks.length === 0) {
        throw new Error(`Tarea con ID ${id} no encontrada`);
      }
      
      const task = tasks[0];
      return {
        id: task.id,
        name: task.name,
        description: task.description || '',
        project_id: task.project_id && task.project_id[0],
        project_name: task.project_id && task.project_id[1],
        user_id: task.user_id && task.user_id[0],
        user_name: task.user_id && task.user_id[1],
        planned_hours: task.planned_hours || 0,
        effective_hours: task.effective_hours || 0,
        date_deadline: task.date_deadline || '',
        priority: task.priority || 'medium',
        state: task.state || 'draft',
        sequence: task.sequence || 0,
        color: task.color
      };
    } catch (error) {
      console.error(`Error fetching task with ID ${id}:`, error);
      // Para desarrollo, buscar en datos simulados
      const allMockTasks: Task[] = [];
      for (let pid = 1; pid <= 5; pid++) {
        allMockTasks.push(...getMockTasks(pid));
      }
      
      const mockTask = allMockTasks.find(t => t.id === id);
      if (!mockTask) {
        throw new Error(`Tarea con ID ${id} no encontrada`);
      }
      return mockTask;
    }
  },

  /**
   * Crear una nueva tarea
   */
  async createTask(data: TaskCreateData): Promise<number> {
    try {
      // Convertir a formato que espera Odoo
      const odooData = {
        name: data.name,
        description: data.description,
        project_id: data.project_id,
        user_id: data.user_id,
        planned_hours: data.planned_hours,
        date_deadline: data.date_deadline,
        priority: data.priority,
        state: data.state,
        sequence: data.sequence
      };
      
      // Llamar a la API de Odoo
      const taskId = await odooAPI.create('project.task', odooData);
      return taskId;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('No se pudo crear la tarea');
    }
  },

  /**
   * Actualizar una tarea existente
   */
  async updateTask(id: number, data: TaskUpdateData): Promise<boolean> {
    try {
      // Filtrar campos vacíos
      const updateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }
      
      // Llamar a la API de Odoo
      const result = await odooAPI.write('project.task', [id], updateData);
      return result;
    } catch (error) {
      console.error(`Error updating task with ID ${id}:`, error);
      throw new Error('No se pudo actualizar la tarea');
    }
  },

  /**
   * Eliminar una tarea
   */
  async deleteTask(id: number): Promise<boolean> {
    try {
      const result = await odooAPI.unlink('project.task', [id]);
      return result;
    } catch (error) {
      console.error(`Error deleting task with ID ${id}:`, error);
      throw new Error('No se pudo eliminar la tarea');
    }
  },

  /**
   * Obtener usuarios asignables a tareas (miembros del proyecto)
   */
  async getProjectMembers(projectId: number): Promise<{id: number, name: string}[]> {
    try {
      // En Odoo, normalmente hay una relación entre proyectos y usuarios asignables
      const members = await odooAPI.callMethod(
        'project.project',
        'get_project_members',
        [projectId]
      );
      
      return members.map((member: any) => ({
        id: member.id,
        name: member.name
      }));
    } catch (error) {
      console.error('Error fetching project members:', error);
      // Datos de prueba
      return [
        { id: 1, name: 'Administrador' },
        { id: 2, name: 'Carlos Jefe de Proyecto' },
        { id: 3, name: 'María Supervisora' },
        { id: 4, name: 'Juan Desarrollador' },
        { id: 5, name: 'Ana Analista' }
      ];
    }
  }
};

// Función para generar datos de prueba
function getMockTasks(projectId: number): Task[] {
  // Hacer que las tareas simuladas sean diferentes según el proyecto
  const baseId = projectId * 100;
  const projectNames: Record<number, string> = {
    1: 'Edificio Residencial Aurora',
    2: 'Centro Comercial Las Condes',
    3: 'Parque Industrial Maipú',
    4: 'Hospital Regional Norte',
    5: 'Conjunto Habitacional Villa Verde'
  };
  
  const users = [
    { id: 1, name: 'Administrador' },
    { id: 2, name: 'Carlos Jefe de Proyecto' },
    { id: 3, name: 'María Supervisora' },
    { id: 4, name: 'Juan Desarrollador' },
    { id: 5, name: 'Ana Analista' }
  ];
  
  // Generar de 5 a 10 tareas por proyecto
  const tasksCount = Math.floor(Math.random() * 6) + 5;
  const tasks: Task[] = [];
  
  const states: ('draft' | 'in_progress' | 'done' | 'cancelled')[] = ['draft', 'in_progress', 'done', 'cancelled'];
  const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];
  
  for (let i = 1; i <= tasksCount; i++) {
    const taskId = baseId + i;
    const userId = users[Math.floor(Math.random() * users.length)].id;
    const userName = users.find(u => u.id === userId)?.name || '';
    
    tasks.push({
      id: taskId,
      name: `Tarea ${i} - Proyecto ${projectId}`,
      description: `Descripción detallada de la tarea ${i} del proyecto ${projectId}`,
      project_id: projectId,
      project_name: projectNames[projectId] || `Proyecto ${projectId}`,
      user_id: userId,
      user_name: userName,
      planned_hours: Math.floor(Math.random() * 40) + 10,
      effective_hours: Math.floor(Math.random() * 30),
      date_deadline: new Date(new Date().setDate(new Date().getDate() + Math.floor(Math.random() * 30))).toISOString().split('T')[0],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      sequence: i,
      color: Math.floor(Math.random() * 10)
    });
  }
  
  return tasks;
}

export default taskService;