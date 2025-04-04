import { useEffect, useState } from 'react';
import odooAPI, { authService } from '../../services/odooService';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

export default function OdooInitializer({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();

  useEffect(() => {
    // Initialize Odoo connection
    const initOdoo = async () => {
      try {
        console.log('Initializing Odoo connection...');
        console.log('Using baseUrl:', odooAPI.getBaseUrl());
        
        // First check if server is accessible
        console.log('Checking connection to CORS endpoint...');
        const isConnected = await odooAPI.checkConnection();
        console.log('Connection check result:', isConnected);
        
        if (!isConnected) {
          setConnectionError('Could not connect to Odoo server. Please check your configuration.');
          setInitialized(true);
          return;
        }
        
        // Check if we have a saved session
        const session = authService.getSession();
        if (session) {
          // Initialize Odoo API with session
          odooAPI.initFromSession(session);
          console.log('Session restored successfully:', session);
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing Odoo:', error);
        setConnectionError('Error initializing Odoo connection.');
        setInitialized(true);
      }
    };

    initOdoo();
  }, []);

  // When user or tenant changes, update Odoo's company ID
  useEffect(() => {
    if (isAuthenticated && user && currentTenant) {
      console.log(`Setting company ID to ${currentTenant.companyId}`);
      odooAPI.setCompanyId(currentTenant.companyId);
    }
  }, [isAuthenticated, user, currentTenant]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-700">Connecting to Odoo...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
          <div className="text-red-600 text-xl mb-4">Connection Error</div>
          <p className="text-gray-700 mb-4">{connectionError}</p>
          <div className="bg-white p-4 rounded-md text-left mb-4 text-sm overflow-auto max-h-40">
            <p className="font-bold">Debugging Info:</p>
            <p>Base URL: {odooAPI.getBaseUrl()}</p>
            <p>Make sure Odoo is running and CORS is properly configured.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}