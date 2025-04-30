// src/context/TenantContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Keep the types the same so components using them don't break
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
  currentTenant: TenantConfig;  // Changed to non-nullable
  setCurrentTenant: (tenant: TenantConfig) => void;
  availableTenants: TenantConfig[];
  isLoading: boolean;
}

// Single default tenant configuration
const defaultTenant: TenantConfig = {
  id: 'default',
  name: 'Construction Company',
  companyId: 1,
  theme: {
    primaryColor: '#3C50E0',
    secondaryColor: '#80CAEE',
    accentColor: '#10B981',
    logoUrl: '/images/logo/logo.svg',
  },
  // Include all features for the MVP
  features: ['cashflow', 'dashboard', 'projects', 'expenses', 'income'],
};

// Create the context with the default tenant
const TenantContext = createContext<TenantContextType>({
  currentTenant: defaultTenant,
  setCurrentTenant: () => {},
  availableTenants: [defaultTenant],
  isLoading: false,
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use the default tenant, non-nullable
  const [currentTenant, setCurrentTenant] = useState<TenantConfig>(defaultTenant);
  // Only include the default tenant in available tenants
  const [availableTenants] = useState<TenantConfig[]>([defaultTenant]);
  const [isLoading, setIsLoading] = useState(false);

  // Apply theme on mount
  React.useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', defaultTenant.theme.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', defaultTenant.theme.secondaryColor);
    document.documentElement.style.setProperty('--color-accent', defaultTenant.theme.accentColor);
    
    // Store default tenant in localStorage to maintain compatibility
    localStorage.setItem('currentTenant', JSON.stringify(defaultTenant));
  }, []);

  // Keep the update function for compatibility
  const updateTenant = (tenant: TenantConfig) => {
    setCurrentTenant(tenant);
    localStorage.setItem('currentTenant', JSON.stringify(tenant));

    // Apply theme changes
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

// Keep the same hook for components that use it
export const useTenant = () => useContext(TenantContext);