import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { ReactNode, useEffect } from 'react';

interface ClerkProtectedRouteProps {
  children: ReactNode;
}

export default function ClerkProtectedRoute({ children }: ClerkProtectedRouteProps) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        {/* Redirigir al landing para hacer sign-in */}
        <RedirectToLanding />
      </SignedOut>
    </>
  );
}

function RedirectToLanding() {
  useEffect(() => {
    // Guardar la URL actual para volver después del login
    const returnUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('clerk_return_url', returnUrl);
    
    // Redirigir al landing
    window.location.href = `http://localhost:3000/sign-in?redirect_url=${encodeURIComponent('http://localhost:5173' + returnUrl)}`;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirigiendo a inicio de sesión...</p>
      </div>
    </div>
  );
}