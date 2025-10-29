// src/context/TenantContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentOrganization, getUserOrganizations, switchOrganization, type Organization, type OrganizationMembership } from '../services/organizationService';
import { useAuth } from '@clerk/clerk-react';

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
  slug?: string;
  userRole?: string;
}

interface TenantContextType {
  currentTenant: TenantConfig;
  setCurrentTenant: (tenant: TenantConfig) => void;
  availableTenants: TenantConfig[];
  isLoading: boolean;
  refreshOrganization: () => Promise<void>;
  switchToOrganization: (organizationId: string) => Promise<void>;
}

// Default theme configuration
const defaultTheme: TenantTheme = {
  primaryColor: '#3C50E0',
  secondaryColor: '#80CAEE',
  accentColor: '#10B981',
  logoUrl: '/images/logo/logo.svg',
};

// Default features
const defaultFeatures = ['cashflow', 'dashboard', 'projects', 'expenses', 'income'];

// Fallback tenant (usado solo si no hay organización)
const fallbackTenant: TenantConfig = {
  id: 'loading',
  name: 'Loading...',
  companyId: 0,
  theme: defaultTheme,
  features: defaultFeatures,
};

// Create the context
const TenantContext = createContext<TenantContextType>({
  currentTenant: fallbackTenant,
  setCurrentTenant: () => {},
  availableTenants: [],
  isLoading: true,
  refreshOrganization: async () => {},
  switchToOrganization: async () => {},
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<TenantConfig>(fallbackTenant);
  const [availableTenants, setAvailableTenants] = useState<TenantConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, isLoaded } = useAuth();

  // Función para convertir Organization a TenantConfig
  const organizationToTenant = (org: Organization): TenantConfig => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    userRole: org.userRole,
    companyId: 1, // Legacy compatibility
    theme: defaultTheme,
    features: defaultFeatures,
  });

  // Función para cargar organización actual
  const loadCurrentOrganization = async () => {
    try {
      setIsLoading(true);
      const org = await getCurrentOrganization();
      const tenant = organizationToTenant(org);
      setCurrentTenant(tenant);
      applyTheme(tenant.theme);
      localStorage.setItem('currentTenant', JSON.stringify(tenant));
    } catch (error) {
      console.error('[TenantContext] Error loading organization:', error);
      // Mantener el tenant actual si falla
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar organizaciones disponibles
  const loadAvailableOrganizations = async () => {
    try {
      const orgs = await getUserOrganizations();
      const tenants = orgs.map(org => organizationToTenant({
        id: org.id,
        name: org.name,
        userRole: org.role
      }));
      setAvailableTenants(tenants);
    } catch (error) {
      console.error('[TenantContext] Error loading organizations:', error);
      setAvailableTenants([]);
    }
  };

  // Aplicar tema
  const applyTheme = (theme: TenantTheme) => {
    document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor);
    document.documentElement.style.setProperty('--color-accent', theme.accentColor);
  };

  // Cambiar de organización
  const switchToOrganization = async (organizationId: string) => {
    try {
      setIsLoading(true);
      await switchOrganization(organizationId);

      // Recargar la organización actual
      await loadCurrentOrganization();

      // Recargar la página para actualizar todos los datos
      window.location.reload();
    } catch (error) {
      console.error('[TenantContext] Error switching organization:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar si el usuario está autenticado
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadCurrentOrganization();
      loadAvailableOrganizations();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  // Aplicar tema inicial
  useEffect(() => {
    applyTheme(defaultTheme);
  }, []);

  // Función de actualización manual del tenant
  const updateTenant = (tenant: TenantConfig) => {
    setCurrentTenant(tenant);
    localStorage.setItem('currentTenant', JSON.stringify(tenant));
    applyTheme(tenant.theme);
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant: updateTenant,
        availableTenants,
        isLoading,
        refreshOrganization: loadCurrentOrganization,
        switchToOrganization,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

// Keep the same hook for components that use it
export const useTenant = () => useContext(TenantContext);