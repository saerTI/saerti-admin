import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/odooService';
import odooAPI from '../services/odooService';

// Define the User type
interface User {
  id: number;
  name: string;
  email: string;
  companyId?: number;
  // Add other user properties as needed
}

// Define the Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  error: null,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const session = authService.getSession();
        if (session) {
          // Get the temporary password from session storage
          const tempPassword = sessionStorage.getItem('odoo_temp_pwd');
          
          // Initialize Odoo API with the session
          odooAPI.initFromSession(session);
          
          if (tempPassword) {
            try {
              // Try to fetch user details to confirm session is valid
              const userDetails = await odooAPI.callMethod(
                'res.users', 
                'read', 
                [[session.uid], ['name', 'login']], 
                { password: tempPassword }
              );
              
              if (userDetails && userDetails.length > 0) {
                setUser({
                  id: session.uid,
                  name: userDetails[0].name || `User ${session.uid}`,
                  email: userDetails[0].login,
                  companyId: session.companyId
                });
                console.log('User session restored successfully');
              } else {
                // Invalid session - clear it
                console.warn('Invalid session data, logging out');
                authService.logout();
              }
            } catch (err) {
              console.error('Error verifying user session:', err);
              // Session invalid or expired - clear it
              authService.logout();
            }
          } else {
            // No temp password, we can't verify the session
            console.warn('No temporary password available, session may be limited');
            // We'll still set the user from the saved session
            setUser({
              id: session.uid,
              name: `User ${session.uid}`, // Placeholder until we can fetch real data
              email: 'user@example.com',   // Placeholder
              companyId: session.companyId
            });
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`Attempting login for user: ${username}`);
      
      // Store password temporarily for this session
      sessionStorage.setItem('odoo_temp_pwd', password);
      
      // Authenticate with Odoo
      const session = await authService.login({ username, password });
      
      // Save session in local storage
      authService.saveSession(session);
      
      console.log('Login successful, fetching user details...');
      
      // Fetch user details
      try {
        const userDetails = await odooAPI.callMethod(
          'res.users', 
          'read', 
          [[session.uid], ['name', 'login']], 
          { password }
        );
        
        if (userDetails && userDetails.length > 0) {
          // Set user in state with real data
          setUser({
            id: session.uid,
            name: userDetails[0].name || `User ${session.uid}`,
            email: userDetails[0].login,
            companyId: session.companyId
          });
        } else {
          // Fallback if no user details
          setUser({
            id: session.uid,
            name: `User ${session.uid}`,
            email: username,
            companyId: session.companyId
          });
        }
      } catch (detailsError) {
        console.error('Error fetching user details:', detailsError);
        // Still create user with basic info
        setUser({
          id: session.uid,
          name: `User ${session.uid}`,
          email: username,
          companyId: session.companyId
        });
      }
      
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      
      // Provide more specific error messages
      if (errorMessage.includes('Access Denied')) {
        setError('Access Denied. Please check your credentials.');
      } else if (errorMessage.includes('Invalid credentials')) {
        setError('Invalid username or password.');
      } else {
        setError(errorMessage);
      }
      
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    // Clear any stored passwords
    sessionStorage.removeItem('odoo_temp_pwd');
  };

  // Create context value object
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the context
export default AuthContext;