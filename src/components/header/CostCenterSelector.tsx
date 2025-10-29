import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useCostCenter } from '../../context/CostCenterContext';

export default function CostCenterSelector() {
  const { selectedCostCenterId, costCenters, loading, setSelectedCostCenterId } = useCostCenter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCenter = costCenters.find(cc => cc.id === selectedCostCenterId);
  const displayText = selectedCenter ? selectedCenter.name : 'Todos los Centros';

  // Debug: Log cuando se renderiza el componente
  console.log('[CostCenterSelector] Renderizado:', { selectedCostCenterId, displayText, costCentersCount: costCenters.length });

  const handleSelect = (id: number | null) => {
    setSelectedCostCenterId(id);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        <Building2 className="w-4 h-4" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          selectedCostCenterId
            ? 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-900/30'
            : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
        } border`}
      >
        <Building2 className="w-4 h-4" />
        <span className="hidden sm:inline max-w-[150px] truncate">{displayText}</span>
        {selectedCostCenterId && (
          <span className="hidden lg:inline px-1.5 py-0.5 text-xs bg-brand-100 dark:bg-brand-900/40 rounded">
            Filtrado
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="py-1 max-h-80 overflow-y-auto">
            {/* Opción "Todos" */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                selectedCostCenterId === null
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <div>
                  <div className="font-medium">Todos los Centros</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Ver información de todos los centros
                  </div>
                </div>
              </div>
            </button>

            {/* Separator */}
            <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

            {/* Lista de centros de costo */}
            {costCenters.filter(cc => cc.active).length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No hay centros de costo activos
              </div>
            ) : (
              costCenters
                .filter(cc => cc.active)
                .map(cc => (
                  <button
                    key={cc.id}
                    onClick={() => handleSelect(cc.id)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      selectedCostCenterId === cc.id
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cc.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {cc.code}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
