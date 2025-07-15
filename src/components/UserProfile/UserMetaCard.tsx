// components/UserMetaCard.tsx
import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { UpdateMetaData } from '../../types/user';
import { getRoleDisplayName } from '../../utils/auth';

interface FormData {
  name: string;
  position: string;
  location: string;
}

interface FormErrors {
  name?: string;
  position?: string;
  location?: string;
  avatar?: string;
}

export default function UserMetaCard() {
  const { user, updateMeta, error, clearError } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    position: user?.position || '',
    location: user?.location || '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Reset form when modal opens
  const handleOpenModal = () => {
    setFormData({
      name: user?.name || '',
      position: user?.position || '',
      location: user?.location || '',
    });
    setFormErrors({});
    setAvatarFile(null);
    setAvatarPreview(null);
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

  // Handle avatar file change
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({ ...prev, avatar: 'Solo se permiten archivos de imagen' }));
        return;
      }
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, avatar: 'El archivo debe ser menor a 2MB' }));
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear avatar error
      setFormErrors(prev => ({ ...prev, avatar: undefined }));
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      clearError();

      const updateData: UpdateMetaData = {
        name: formData.name.trim(),
        position: formData.position.trim() || undefined,
        location: formData.location.trim() || undefined,
      };

      await updateMeta(updateData);

      // TODO: Implementar upload de avatar si es necesario
      if (avatarFile) {
        // await uploadAvatar(avatarFile);
        console.log('Avatar upload functionality to be implemented');
      }

      closeModal();
    } catch (error) {
      console.error('Error updating meta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user.name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.position || getRoleDisplayName(user.role)}
                </p>
                {user.location && (
                  <>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.location}
                    </p>
                  </>
                )}
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
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar información del perfil
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Modifica tu información básica y foto de perfil.
            </p>
          </div>

          {error && (
            <div className="mx-2 mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="px-2 overflow-y-auto custom-scrollbar">
              
              {/* Avatar Section */}
              <div className="mb-6">
                <Label>Foto de perfil</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={isLoading}
                    />
                    {formErrors.avatar && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.avatar}</p>
                    )}
                  </div>
                </div>
              </div>

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
                  <Label>Cargo/Posición</Label>
                  <Input 
                    type="text" 
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    error={!!formErrors.position}
                    hint={formErrors.position}
                    disabled={isLoading}
                    placeholder="Ej: Team Manager, Desarrollador"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Ubicación</Label>
                  <Input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    error={!!formErrors.location}
                    hint={formErrors.location}
                    disabled={isLoading}
                    placeholder="Ej: Valdivia, Chile"
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
    </>
  );
}