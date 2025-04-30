// src/components/common/TenantSynchronizer.tsx
import { useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';

const TenantSynchronizer = () => {
  const { currentTenant } = useTenant();

  useEffect(() => {
    // Apply theme on mount - keep this functionality
    document.documentElement.style.setProperty('--color-primary', currentTenant.theme.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', currentTenant.theme.secondaryColor);
    document.documentElement.style.setProperty('--color-accent', currentTenant.theme.accentColor);
  }, [currentTenant]);

  return null;
};

export default TenantSynchronizer;