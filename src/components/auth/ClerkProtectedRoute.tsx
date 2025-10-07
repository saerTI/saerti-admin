// src/components/auth/ClerkProtectedRoute.tsx
import { useAuth } from '@clerk/clerk-react';
import { ReactNode, useEffect } from 'react';

interface ClerkProtectedRouteProps {
  children: ReactNode;
}

export default function ClerkProtectedRoute({ children }: ClerkProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();

  // Mientras carga Clerk
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si NO está autenticado, redirigir
  if (!isSignedIn) {
    return <RedirectToLanding />;
  }

  // Si está autenticado, mostrar contenido
  return <>{children}</>;
}

function RedirectToLanding() {
  useEffect(() => {
    // Guardar la URL actual para volver después del login
    const returnUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('clerk_return_url', returnUrl);
    
    // Redirigir al landing
    const redirectUrl = `http://localhost:3000/sign-in?redirect_url=${encodeURIComponent('http://localhost:5173' + returnUrl)}`;
    console.log('[ClerkProtectedRoute] Redirigiendo a:', redirectUrl);
    
    window.location.href = redirectUrl;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md px-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <svg 
            className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Autenticación requerida
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Redirigiendo al sistema de login...
          </p>
          <div className="animate-pulse">
            <div className="h-2 bg-blue-200 dark:bg-blue-700 rounded-full w-full"></div>
          </div>
        </div>
        <a 
          href={`http://localhost:3000/sign-in?redirect_url=${encodeURIComponent('http://localhost:5173' + window.location.pathname)}`}
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ir a Login manualmente
        </a>
      </div>
    </div>
  );
}