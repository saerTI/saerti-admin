import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCostCenters, CostCenter } from '../services/costCenterService';

interface CostCenterContextType {
  selectedCostCenterId: number | null; // null means "Todos"
  costCenters: CostCenter[];
  loading: boolean;
  setSelectedCostCenterId: (id: number | null) => void;
  loadCostCenters: () => Promise<void>;
}

const CostCenterContext = createContext<CostCenterContextType | undefined>(undefined);

export const CostCenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<number | null>(null);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Log cuando cambia el centro de costo seleccionado
  React.useEffect(() => {
    console.log('[CostCenterContext] Centro de costo seleccionado:', selectedCostCenterId);
  }, [selectedCostCenterId]);

  const loadCostCenters = async () => {
    try {
      setLoading(true);
      const data = await getCostCenters();
      setCostCenters(data);
    } catch (error) {
      console.error('Error loading cost centers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCostCenters();
  }, []);

  return (
    <CostCenterContext.Provider
      value={{
        selectedCostCenterId,
        costCenters,
        loading,
        setSelectedCostCenterId,
        loadCostCenters,
      }}
    >
      {children}
    </CostCenterContext.Provider>
  );
};

export const useCostCenter = () => {
  const context = useContext(CostCenterContext);
  if (context === undefined) {
    throw new Error('useCostCenter must be used within a CostCenterProvider');
  }
  return context;
};
