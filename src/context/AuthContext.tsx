// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import odooAPI, { authService } from '../services/odooService';
import { useTenant } from './TenantContext';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  companyId: number;
  companyName: string;
  role: string;
}

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

// Create the Auth Context
export const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { currentTenant, setCurrentTenant, availableTenants } = useTenant();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = authService.getSession();
        if (session) {
          // Initialize Odoo client with session
          odooAPI.initFromSession(session);
          
          // Get user info
          const userResult = await odooAPI.read('res.users', [session.uid], [
            'name', 
            'login', 
            'email', 
            'company_id',
            'groups_id',
          ]);
          
          if (userResult && userResult.length > 0) {
            const userData = userResult[0];
            
            // Determine user role based on groups
            const groups = await odooAPI.read('res.groups', userData.groups_id, ['name']);
            const groupNames = groups.map((g: any) => g.name);
            
            let role = 'user';
            if (groupNames.includes('Administrator')) {
              role = 'admin';
            } else if (groupNames.includes('Manager')) {
              role = 'manager';
            }
            
            const user: User = {
              id: userData.id,
              name: userData.name,
              email: userData.email || userData.login,
              companyId: userData.company_id[0],
              companyName: userData.company_id[1],
              role,
            };
            
            setUser(user);
            
            // Set current tenant based on company_id
            const tenantForCompany = availableTenants.find(t => t.companyId === user.companyId);
            if (tenantForCompany && (!currentTenant || currentTenant.companyId !== user.companyId)) {
              setCurrentTenant(tenantForCompany);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
        // Clear session on error
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [currentTenant, setCurrentTenant, availableTenants]);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Use the odooService authService to authenticate
      const session = await authService.login({ username, password });
      
      // Save the session
      authService.saveSession(session);
      
      // Initialize Odoo client with session
      odooAPI.initFromSession(session);
      
      // Get user info
      const userResult = await odooAPI.read('res.users', [session.uid], [
        'name', 
        'login', 
        'email', 
        'company_id',
        'groups_id',
      ]);
      
      if (userResult && userResult.length > 0) {
        const userData = userResult[0];
        
        // Get groups for role determination
        const groups = await odooAPI.read('res.groups', userData.groups_id, ['name']);
        const groupNames = groups.map((g: any) => g.name);
        
        let role = 'user';
        if (groupNames.includes('Administrator')) {
          role = 'admin';
        } else if (groupNames.includes('Manager')) {
          role = 'manager';
        }
        
        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email || userData.login,
          companyId: userData.company_id[0],
          companyName: userData.company_id[1],
          role,
        };
        
        setUser(user);
        
        // Set tenant based on company
        const tenantForCompany = availableTenants.find(t => t.companyId === user.companyId);
        if (tenantForCompany) {
          setCurrentTenant(tenantForCompany);
        }
        
        // Let the SignInForm handle navigation instead of doing it here
        // This avoids conflict when the form tries to navigate to the original requested page
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/auth/signin');
  };

  // Update user function
  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);