import { createContext, useContext, ReactNode, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  UpdateProfileData,
  UpdateMetaData,
  UpdateAddressData,
  mapClerkUserToLocal // ✅ Importar el helper
} from '../types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Authentication methods (deprecados pero mantenidos para compatibilidad)
  login: (email: string, password: string) => Promise<boolean>;
  loginWithCredentials: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile management
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updateMeta: (data: UpdateMetaData) => Promise<void>;
  updateAddress: (data: UpdateAddressData) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utility methods
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();
  const [error, setError] = useState<string | null>(null);

  // ✅ Usar el helper para mapear el usuario
  const user: User | null = clerkUser ? mapClerkUserToLocal(clerkUser) : null;

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Login - redirige a Clerk SignIn
  const login = async (email: string, password: string): Promise<boolean> => {
    console.warn('login() está deprecado con Clerk. Usa el flujo de Clerk.');
    openSignIn({ redirectUrl: 'http://localhost:5173' });
    return false;
  };

  // Login with credentials - redirige a Clerk SignIn
  const loginWithCredentials = async (credentials: LoginCredentials): Promise<void> => {
    console.warn('loginWithCredentials() está deprecado con Clerk. Usa el flujo de Clerk.');
    openSignIn({ redirectUrl: 'http://localhost:5173' });
  };

  // Register - redirige a Clerk SignUp
  const register = async (userData: RegisterData): Promise<void> => {
    console.warn('register() está deprecado con Clerk. Usa el flujo de Clerk.');
    window.location.href = 'http://localhost:3000/sign-up';
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut();
      window.location.href = 'http://localhost:3000';
    } catch (err) {
      console.error('Logout error:', err);
      setError('Error al cerrar sesión');
    }
  };

  // Profile management - usar metadata de Clerk
  const updateProfile = async (data: UpdateProfileData): Promise<void> => {
    setError(null);
    try {
      if (!clerkUser) {
        throw new Error('No user logged in');
      }

      // Actualizar usando la API de Clerk
      await clerkUser.update({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      });

      // Actualizar metadata pública si hay campos adicionales
      if (data.position || data.location || data.company || data.phone) {
        await clerkUser.update({
          unsafeMetadata: {
            ...clerkUser.unsafeMetadata,
            position: data.position,
            location: data.location,
            company: data.company,
            phone: data.phone,
          }
        });
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      const errorMessage = 'Error al actualizar perfil';
      setError(errorMessage);
      throw err;
    }
  };

  const updateMeta = async (data: UpdateMetaData): Promise<void> => {
    setError(null);
    try {
      if (!clerkUser) {
        throw new Error('No user logged in');
      }

      // Actualizar campos básicos de Clerk
      if (data.firstName || data.lastName || data.username) {
        await clerkUser.update({
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
        });
      }

      // Actualizar metadata pública
      await clerkUser.update({
        unsafeMetadata: {
          ...clerkUser.unsafeMetadata,
          position: data.position,
          location: data.location,
          company: data.company,
          phone: data.phone,
        }
      });
    } catch (err: any) {
      console.error('Update meta error:', err);
      const errorMessage = 'Error al actualizar información del perfil';
      setError(errorMessage);
      throw err;
    }
  };

  const updateAddress = async (data: UpdateAddressData): Promise<void> => {
    setError(null);
    try {
      if (!clerkUser) {
        throw new Error('No user logged in');
      }

      await clerkUser.update({
        unsafeMetadata: {
          ...clerkUser.unsafeMetadata,
          address: data.address,
          country: data.country,
          city: data.city,
          postal_code: data.postal_code,
        }
      });
    } catch (err: any) {
      console.error('Update address error:', err);
      const errorMessage = 'Error al actualizar dirección';
      setError(errorMessage);
      throw err;
    }
  };

  const uploadAvatar = async (file: File): Promise<void> => {
    setError(null);
    try {
      if (!clerkUser) {
        throw new Error('No user logged in');
      }

      await clerkUser.setProfileImage({ file });
    } catch (err: any) {
      console.error('Upload avatar error:', err);
      const errorMessage = 'Error al subir avatar';
      setError(errorMessage);
      throw err;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      await clerkUser?.reload();
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!clerkUser && isUserLoaded,
    isLoading: !isUserLoaded,
    error,
    
    // Authentication methods
    login,
    loginWithCredentials,
    register,
    logout,
    
    // Profile management
    updateProfile,
    updateMeta,
    updateAddress,
    uploadAvatar,
    refreshUser,
    
    // Utility methods
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;