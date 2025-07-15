// components/UserInfoCard.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { UpdateProfileData } from '../../types/user';
import { getRoleDisplayName, isValidEmail } from '../../utils/auth';

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function UserInfoCard() {
  const { user, updateProfile, error, clearError } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Reset form when modal opens
  const handleOpenModal = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setFormErrors({});
    setShowPasswordFields(false);
    clearError();
    openModal();
  };

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'El email no es válido';
    }

    // Password validation (only if changing password)
    if (showPasswordFields || formData.newPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'La contraseña actual es obligatoria';
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'La nueva contraseña es obligatoria';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      clearError();

      const updateData: UpdateProfileData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      // Add password fields if changing password
      if (showPasswordFields && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await updateProfile(updateData);
      closeModal();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Información Personal
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nombre
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.name}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Rol
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {getRoleDisplayName(user.role)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.email}
              </p>
            </div>

          </div>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Editar
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar información personal
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Modifica tu información para mantener tu perfil actualizado.
            </p>
          </div>

          {error && (
            <div className="mx-2 mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Información personal
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Nombre *</Label>
                    <Input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!!formErrors.name}
                      hint={formErrors.name}
                      disabled={isLoading}
                      placeholder="Ingresa tu nombre"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Rol</Label>
                    <Input 
                      type="text" 
                      value={getRoleDisplayName(user.role)}
                      disabled={true}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email *</Label>
                    <Input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      error={!!formErrors.email}
                      hint={formErrors.email}
                      disabled={isLoading}
                      placeholder="Ingresa tu email"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Estado</Label>
                    <Input 
                      type="text" 
                      value={user.active ? 'Activo' : 'Inactivo'}
                      disabled={true}
                    />
                  </div>

                  {/* Password Change Section */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="changePassword"
                        checked={showPasswordFields}
                        onChange={(e) => setShowPasswordFields(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <label htmlFor="changePassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cambiar contraseña
                      </label>
                    </div>

                    {showPasswordFields && (
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="col-span-2 lg:col-span-1">
                          <Label>Contraseña actual *</Label>
                          <Input 
                            type="password" 
                            value={formData.currentPassword}
                            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                            error={!!formErrors.currentPassword}
                            hint={formErrors.currentPassword}
                            disabled={isLoading}
                            placeholder="Contraseña actual"
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Nueva contraseña *</Label>
                          <Input 
                            type="password" 
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            error={!!formErrors.newPassword}
                            hint={formErrors.newPassword}
                            disabled={isLoading}
                            placeholder="Nueva contraseña"
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Confirmar nueva contraseña *</Label>
                          <Input 
                            type="password" 
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            error={!!formErrors.confirmPassword}
                            hint={formErrors.confirmPassword}
                            disabled={isLoading}
                            placeholder="Confirmar contraseña"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={closeModal}
                disabled={isLoading}
                type="button"
              >
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}