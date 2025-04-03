// src/context/TenantContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';

// Types
interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
}

interface TenantConfig {
  id: string;
  name: string;
  theme: TenantTheme;
  features: string[];
  companyId: number;
}

interface TenantContextType {
  currentTenant: TenantConfig | null;
  setCurrentTenant: (tenant: TenantConfig) => void;
  availableTenants: TenantConfig[];
  isLoading: boolean;
}

// Default tenant configurations
const defaultTenants: TenantConfig[] = [
  {
    id: 'company1',
    name: 'Construction Company 1',
    companyId: 1,
    theme: {
      primaryColor: '#3C50E0',
      secondaryColor: '#80CAEE',
      accentColor: '#10B981',
      logoUrl: '/images/logo/logo.svg',
    },
    features: ['cashflow', 'dashboard', 'projects'],
  },
  {
    id: 'company2',
    name: 'Construction Company 2',
    companyId: 2,
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#4E8098',
      accentColor: '#1D4657',
      logoUrl: '/images/logo/logo-dark.svg',
    },
    features: ['cashflow', 'dashboard'],
  },
];

// Create the context
const TenantContext = createContext<TenantContextType>({
  currentTenant: null,
  setCurrentTenant: () => {},
  availableTenants: [],
  isLoading: true,
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<TenantConfig | null>(null);
  const [availableTenants, _setAvailableTenants] = useState<TenantConfig[]>(defaultTenants);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch tenants from an API
    // For now, we use the static list
    setIsLoading(false);

    // Try to restore from localStorage
    const storedTenant = localStorage.getItem('currentTenant');
    if (storedTenant) {
      try {
        const tenant = JSON.parse(storedTenant) as TenantConfig;
        setCurrentTenant(tenant);
      } catch (e) {
        console.error('Error parsing stored tenant', e);
        // Use the first tenant as default if there's an error
        if (defaultTenants.length > 0) {
          setCurrentTenant(defaultTenants[0]);
        }
      }
    } else if (defaultTenants.length > 0) {
      // Use the first tenant as default
      setCurrentTenant(defaultTenants[0]);
    }
  }, []);

  // Update tenant
  const updateTenant = (tenant: TenantConfig) => {
    setCurrentTenant(tenant);
    localStorage.setItem('currentTenant', JSON.stringify(tenant));

    // Apply tenant theme
    document.documentElement.style.setProperty('--color-primary', tenant.theme.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', tenant.theme.secondaryColor);
    document.documentElement.style.setProperty('--color-accent', tenant.theme.accentColor);
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant: updateTenant,
        availableTenants,
        isLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

// Hook to use the tenant context
export const useTenant = () => useContext(TenantContext);