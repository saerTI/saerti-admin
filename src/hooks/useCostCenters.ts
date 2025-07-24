// src/hooks/useCostCenters.ts - CORREGIDO

import { useState, useEffect } from 'react';
import { getProjects } from '../services/projectService';
import type { Project } from '../types/project';

interface CostCenter {
  id: number;
  code: string;
  name: string;
  type: string;
  client?: string; // ✅ CORREGIDO: string en lugar de objeto
  status: string;
}

export const useCostCenters = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener todos los proyectos (que son cost centers)
      const projects = await getProjects({});
      
      // Mapear a formato CostCenter
      const mappedCostCenters: CostCenter[] = projects.map(project => ({
        id: project.id,
        code: project.code,
        name: project.name,
        type: 'proyecto', // ✅ CORREGIDO: hardcoded porque Project no tiene type
        client: project.client?.name || '', // ✅ CORREGIDO: extraer name del objeto client
        status: project.status
      }));
      
      setCostCenters(mappedCostCenters);
    } catch (err) {
      console.error('Error fetching cost centers:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar centros de costo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const refresh = () => {
    fetchCostCenters();
  };

  return {
    costCenters,
    loading,
    error,
    refresh
  };
};