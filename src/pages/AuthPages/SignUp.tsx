import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignUpForm from '../../components/auth/SignUpForm';
import AuthLayout from './AuthPageLayout';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';

const SignUp: React.FC = () => {
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
        title="Registrarse - SAER" 
        description="Crear una nueva cuenta para acceder al sistema de gestión SAER" 
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
};

export default SignUp;