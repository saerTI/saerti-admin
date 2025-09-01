// src/hooks/useCostCenterSelect.ts

import { useState, useEffect } from 'react';
import { getCostCenters, type CostCenter } from '../services/costCenterService';

export interface CostCenterOption {
  value: string;
  label: string;
}

export const useCostCenterSelect = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [costCenterOptions, setCostCenterOptions] = useState<CostCenterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const centers = await getCostCenters();
      setCostCenters(centers);
      
      // Convert to select options
      const options: CostCenterOption[] = centers
        .filter(center => center.active)
        .map(center => ({
          value: center.code,
          label: `${center.code} - ${center.name}`
        }));
      
      setCostCenterOptions(options);
    } catch (err) {
      console.error('Error fetching cost centers:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar centros de costo');
      setCostCenterOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);

  return {
    costCenters,
    costCenterOptions,
    loading,
    error,
    refetch: fetchCostCenters
  };
};
