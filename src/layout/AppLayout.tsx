import { useCallback } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Manejador para cerrar el sidebar al hacer clic en el backdrop
  const handleBackdropClick = useCallback(() => {
    setIsMobileOpen(false);
  }, [setIsMobileOpen]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - debe mantenerse como componente separado */}
      <AppSidebar />
      
      {/* Contenedor principal - con margen ajustado */}
      <div
        className={`w-full min-h-screen transition-all duration-300 ease-in-out
          ${isExpanded || isHovered ? "lg:pl-[200px]" : "lg:pl-[60px]"}`}
      >
        {/* Header */}
        <div className="sticky top-0 w-full z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <AppHeader />
        </div>
        
        {/* Contenido principal */}
        <div className="w-full">
          <Outlet />
        </div>
      </div>
      
      {/* Backdrop - sólo visible cuando el sidebar móvil está abierto */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleBackdropClick}
        />
      )}
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;