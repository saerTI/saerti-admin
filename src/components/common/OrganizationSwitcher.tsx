// src/components/common/OrganizationSwitcher.tsx
import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { ChevronDown, Building2, Check } from 'lucide-react';

interface OrganizationSwitcherProps {
  className?: string;
}

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({ className = '' }) => {
  const { currentTenant, availableTenants, switchToOrganization, isLoading } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === currentTenant.id || isSwitching) return;

    try {
      setIsSwitching(true);
      await switchToOrganization(organizationId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching organization:', error);
      alert('Error al cambiar de organización. Por favor intenta nuevamente.');
    } finally {
      setIsSwitching(false);
    }
  };

  // Si solo hay una organización, mostrar solo el nombre (sin dropdown)
  if (availableTenants.length <= 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {isLoading ? 'Cargando...' : currentTenant.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching || isLoading}
        className="flex items-center justify-between w-full gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {isSwitching ? 'Cambiando...' : isLoading ? 'Cargando...' : currentTenant.name}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            <div className="py-1">
              {availableTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSwitch(tenant.id)}
                  disabled={isSwitching}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    tenant.id === currentTenant.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0">
                      <span className="font-medium truncate">{tenant.name}</span>
                      {tenant.userRole && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {tenant.userRole}
                        </span>
                      )}
                    </div>
                  </div>
                  {tenant.id === currentTenant.id && (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Opción para crear nueva organización (opcional) */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Implementar creación de organización
                  alert('La creación de organizaciones se implementará próximamente.');
                }}
              >
                <span className="text-lg">+</span>
                <span>Crear nueva organización</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganizationSwitcher;
