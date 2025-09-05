// src/components/BudgetAnalyzer/ImprovedScheduleComponent.tsx

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Download,
  Layers,
  Target
} from 'lucide-react';
import { generateGanttPDF } from '../../services/pdfReportGenerator';

interface ScheduleProps {
  projectData: {
    area: number;
    tipo: string;
    ubicacion: string;
  };
  budgetData: {
    totalConIva: number;
  };
}

interface ProjectPhase {
  id: string;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  duracionDias: number;
  porcentajeAvance: number;
  porcentajeCosto: number;
  actividades: Activity[];
  color: string;
  dependencias: string[];
}

interface Activity {
  id: string;
  nombre: string;
  duracion: number;
  responsable: string;
  estado: 'pendiente' | 'en_progreso' | 'completado';
}

interface Milestone {
  nombre: string;
  fecha: Date;
  descripcion: string;
  tipo: 'inicio' | 'intermedio' | 'final';
  icon: React.ReactNode;
}

export const ImprovedScheduleComponent: React.FC<ScheduleProps> = ({ 
  projectData, 
  budgetData 
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'gantt' | 'lista' | 'calendario'>('gantt');

  // Calcular cronograma basado en el tipo y tamaño del proyecto
  const scheduleData = useMemo(() => {
    const baseDate = new Date();
    const area = projectData.area;
    
    // Factores de duración según tipo de proyecto
    const durationFactors = {
      residential: 1.0,
      commercial: 1.2,
      industrial: 1.5,
      infrastructure: 2.0,
      renovation: 0.8
    };
    
    const factor = durationFactors[projectData.tipo as keyof typeof durationFactors] || 1.0;
    
    // Calcular duración base (días) según área
    const baseDuration = Math.ceil(Math.sqrt(area) * 10 * factor);
    
    // Definir fases del proyecto
    const phases: ProjectPhase[] = [
      {
        id: 'preliminar',
        nombre: 'Obras Preliminares',
        fechaInicio: new Date(baseDate),
        fechaFin: new Date(baseDate.getTime() + (baseDuration * 0.1 * 24 * 60 * 60 * 1000)),
        duracionDias: Math.ceil(baseDuration * 0.1),
        porcentajeAvance: 100,
        porcentajeCosto: 5,
        color: 'bg-blue-500',
        dependencias: [],
        actividades: [
          { id: 'a1', nombre: 'Instalación de faenas', duracion: 3, responsable: 'Contratista', estado: 'completado' },
          { id: 'a2', nombre: 'Trazado y niveles', duracion: 2, responsable: 'Topógrafo', estado: 'completado' },
          { id: 'a3', nombre: 'Excavaciones', duracion: 5, responsable: 'Contratista', estado: 'completado' }
        ]
      },
      {
        id: 'fundaciones',
        nombre: 'Fundaciones',
        fechaInicio: new Date(baseDate.getTime() + (baseDuration * 0.1 * 24 * 60 * 60 * 1000)),
        fechaFin: new Date(baseDate.getTime() + (baseDuration * 0.25 * 24 * 60 * 60 * 1000)),
        duracionDias: Math.ceil(baseDuration * 0.15),
        porcentajeAvance: 75,
        porcentajeCosto: 15,
        color: 'bg-gray-500',
        dependencias: ['preliminar'],
        actividades: [
          { id: 'f1', nombre: 'Excavación de fundaciones', duracion: 5, responsable: 'Contratista', estado: 'completado' },
          { id: 'f2', nombre: 'Hormigón de cimientos', duracion: 7, responsable: 'Contratista', estado: 'en_progreso' },
          { id: 'f3', nombre: 'Impermeabilización', duracion: 3, responsable: 'Especialista', estado: 'pendiente' }
        ]
      },
      {
        id: 'estructura',
        nombre: 'Obra Gruesa',
        fechaInicio: new Date(baseDate.getTime() + (baseDuration * 0.25 * 24 * 60 * 60 * 1000)),
        fechaFin: new Date(baseDate.getTime() + (baseDuration * 0.55 * 24 * 60 * 60 * 1000)),
        duracionDias: Math.ceil(baseDuration * 0.3),
        porcentajeAvance: 40,
        porcentajeCosto: 35,
        color: 'bg-green-500',
        dependencias: ['fundaciones'],
        actividades: [
          { id: 'e1', nombre: 'Estructura de hormigón', duracion: 15, responsable: 'Contratista', estado: 'en_progreso' },
          { id: 'e2', nombre: 'Albañilería', duracion: 10, responsable: 'Albañiles', estado: 'pendiente' },
          { id: 'e3', nombre: 'Techumbres', duracion: 8, responsable: 'Especialista', estado: 'pendiente' }
        ]
      },
      {
        id: 'instalaciones',
        nombre: 'Instalaciones',
        fechaInicio: new Date(baseDate.getTime() + (baseDuration * 0.45 * 24 * 60 * 60 * 1000)),
        fechaFin: new Date(baseDate.getTime() + (baseDuration * 0.75 * 24 * 60 * 60 * 1000)),
        duracionDias: Math.ceil(baseDuration * 0.3),
        porcentajeAvance: 20,
        porcentajeCosto: 20,
        color: 'bg-yellow-500',
        dependencias: ['estructura'],
        actividades: [
          { id: 'i1', nombre: 'Instalaciones eléctricas', duracion: 12, responsable: 'Electricista', estado: 'pendiente' },
          { id: 'i2', nombre: 'Instalaciones sanitarias', duracion: 10, responsable: 'Gasfiter', estado: 'pendiente' },
          { id: 'i3', nombre: 'Climatización', duracion: 8, responsable: 'Especialista HVAC', estado: 'pendiente' }
        ]
      },
      {
        id: 'terminaciones',
        nombre: 'Terminaciones',
        fechaInicio: new Date(baseDate.getTime() + (baseDuration * 0.75 * 24 * 60 * 60 * 1000)),
        fechaFin: new Date(baseDate.getTime() + (baseDuration * 24 * 60 * 60 * 1000)),
        duracionDias: Math.ceil(baseDuration * 0.25),
        porcentajeAvance: 0,
        porcentajeCosto: 25,
        color: 'bg-purple-500',
        dependencias: ['instalaciones'],
        actividades: [
          { id: 't1', nombre: 'Revestimientos', duracion: 10, responsable: 'Contratista', estado: 'pendiente' },
          { id: 't2', nombre: 'Pinturas', duracion: 8, responsable: 'Pintores', estado: 'pendiente' },
          { id: 't3', nombre: 'Limpieza final', duracion: 3, responsable: 'Contratista', estado: 'pendiente' }
        ]
      }
    ];
    
    // Calcular hitos
    const milestones: Milestone[] = [
      {
        nombre: 'Inicio de Obra',
        fecha: baseDate,
        descripcion: 'Entrega de terreno e inicio de faenas',
        tipo: 'inicio',
        icon: <Target className="w-4 h-4" />
      },
      {
        nombre: 'Término Obra Gruesa',
        fecha: new Date(baseDate.getTime() + (baseDuration * 0.55 * 24 * 60 * 60 * 1000)),
        descripcion: 'Estructura completa y techada',
        tipo: 'intermedio',
        icon: <Layers className="w-4 h-4" />
      },
      {
        nombre: 'Recepción Municipal',
        fecha: new Date(baseDate.getTime() + (baseDuration * 0.95 * 24 * 60 * 60 * 1000)),
        descripcion: 'Inspección y aprobación municipal',
        tipo: 'intermedio',
        icon: <CheckCircle className="w-4 h-4" />
      },
      {
        nombre: 'Entrega Final',
        fecha: new Date(baseDate.getTime() + (baseDuration * 24 * 60 * 60 * 1000)),
        descripcion: 'Entrega de llaves al cliente',
        tipo: 'final',
        icon: <CheckCircle className="w-4 h-4" />
      }
    ];
    
    return {
      phases,
      milestones,
      duracionTotal: {
        dias: baseDuration,
        semanas: Math.ceil(baseDuration / 7),
        meses: Math.ceil(baseDuration / 30)
      },
      fechaInicio: baseDate.toLocaleDateString('es-CL'),
      fechaFin: new Date(baseDate.getTime() + (baseDuration * 24 * 60 * 60 * 1000)).toLocaleDateString('es-CL'),
      avanceGeneral: Math.round(phases.reduce((acc, phase) => acc + phase.porcentajeAvance * phase.porcentajeCosto, 0) / 100)
    };
  }, [projectData]);

  // Formatear fecha
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calcular posición en el Gantt
  const calculateGanttPosition = (startDate: Date, duration: number, totalDuration: number) => {
    const baseDate = new Date();
    const start = ((startDate.getTime() - baseDate.getTime()) / (totalDuration * 24 * 60 * 60 * 1000)) * 100;
    const width = (duration / totalDuration) * 100;
    return { left: `${start}%`, width: `${width}%` };
  };

  // Exportar Gantt a PDF
  const handleExportGantt = async () => {
    try {
      await generateGanttPDF({
        ...scheduleData,
        projectInfo: projectData,
        budget: budgetData
      });
    } catch (error) {
      console.error('Error exportando Gantt:', error);
      alert('Error al exportar el cronograma');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
            Cronograma del Proyecto
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Duración estimada: {scheduleData.duracionTotal.meses} meses ({scheduleData.duracionTotal.dias} días)
          </p>
        </div>
        <div className="flex gap-2">
          {/* Selector de vista */}
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1 text-sm ${viewMode === 'gantt' ? 'bg-blue-500 text-white' : 'text-gray-700'} rounded-l-lg`}
            >
              Gantt
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={`px-3 py-1 text-sm ${viewMode === 'lista' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={`px-3 py-1 text-sm ${viewMode === 'calendario' ? 'bg-blue-500 text-white' : 'text-gray-700'} rounded-r-lg`}
            >
              Calendario
            </button>
          </div>
          <button
            onClick={handleExportGantt}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Resumen de avance */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Avance General del Proyecto</span>
          <span className="text-sm font-bold text-blue-600">{scheduleData.avanceGeneral}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${scheduleData.avanceGeneral}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Inicio: {scheduleData.fechaInicio}</span>
          <span>Fin estimado: {scheduleData.fechaFin}</span>
        </div>
      </div>

      {/* Vista Gantt */}
      {viewMode === 'gantt' && (
        <div className="space-y-4">
          {/* Timeline header */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>
                Mes {i + 1}
              </span>
            ))}
          </div>

          {/* Gantt bars */}
          <div className="space-y-3">
            {scheduleData.phases.map((phase) => {
              const position = calculateGanttPosition(
                phase.fechaInicio,
                phase.duracionDias,
                scheduleData.duracionTotal.dias
              );
              
              return (
                <div key={phase.id} className="relative">
                  <div className="flex items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 w-32">
                      {phase.nombre}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({phase.duracionDias} días)
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded">
                    <div
                      className={`absolute h-full ${phase.color} rounded opacity-70`}
                      style={position}
                    >
                      <div
                        className="h-full bg-white bg-opacity-30 rounded"
                        style={{ width: `${phase.porcentajeAvance}%` }}
                      />
                    </div>
                    <span className="absolute right-2 top-1 text-xs text-gray-700 font-medium">
                      {phase.porcentajeAvance}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hitos */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Hitos Importantes</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {scheduleData.milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className={`p-2 rounded-full ${
                    milestone.tipo === 'inicio' ? 'bg-green-100 text-green-600' :
                    milestone.tipo === 'final' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {milestone.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{milestone.nombre}</p>
                    <p className="text-xs text-gray-500">{formatDate(milestone.fecha)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === 'lista' && (
        <div className="space-y-4">
          {scheduleData.phases.map((phase) => (
            <div key={phase.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{phase.nombre}</h4>
                  <p className="text-sm text-gray-600">
                    {formatDate(phase.fechaInicio)} - {formatDate(phase.fechaFin)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${phase.color} text-white`}>
                    {phase.porcentajeAvance}% completado
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{phase.duracionDias} días</p>
                </div>
              </div>
              
              {/* Actividades */}
              <div className="space-y-2">
                {phase.actividades.map((actividad) => (
                  <div key={actividad.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      {actividad.estado === 'completado' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                      {actividad.estado === 'en_progreso' && <Clock className="w-4 h-4 text-yellow-500 mr-2" />}
                      {actividad.estado === 'pendiente' && <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />}
                      <span className={actividad.estado === 'completado' ? 'line-through text-gray-500' : ''}>
                        {actividad.nombre}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{actividad.responsable}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Calendario (simplificada) */}
      {viewMode === 'calendario' && (
        <div className="text-center text-gray-500 py-8">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Vista de calendario en desarrollo</p>
          <p className="text-sm mt-2">Use la vista Gantt o Lista por ahora</p>
        </div>
      )}
    </div>
  );
};