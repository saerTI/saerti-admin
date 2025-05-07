import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

// AppLayout.tsx - Solución completa
const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="flex min-h-screen relative">
      {/* Sidebar fijo - fuera del flujo normal */}
      <div className="fixed top-0 left-0 z-40 h-screen">
        <AppSidebar />
      </div>
      
      {/* Contenedor principal - con ancho calculado correctamente */}
      <div 
        className={`w-full transition-all duration-300 ease-in-out
          ${isExpanded || isHovered ? "lg:pl-[290px]" : "lg:pl-[90px]"}`}
      >
        {/* Header - anclado al contenedor principal */}
        <div className="sticky top-0 w-full z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <AppHeader />
        </div>
        
        {/* Contenido - con ancho limitado al espacio disponible */}
        <div className="w-full p-4 md:p-6">
          <Outlet />
        </div>
      </div>
      
      {/* Backdrop para móviles */}
      {isMobileOpen && <Backdrop />}
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
