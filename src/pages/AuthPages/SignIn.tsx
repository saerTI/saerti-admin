// src/pages/AuthPages/SignIn.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '../../components/auth/SignInForm';
import AuthLayout from './AuthPageLayout';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';

const SignIn: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirigir al panel si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <>
      <PageMeta 
        title="Iniciar Sesión - SAER" 
        description="Ingrese a su cuenta para acceder al sistema de gestión SAER" 
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
};

export default SignIn;