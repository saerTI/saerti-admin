import React from "react";
import { useSidebar } from "../context/SidebarContext";

const Backdrop: React.FC = () => {
  const { setIsMobileOpen } = useSidebar();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsMobileOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      onClick={handleBackdropClick}
    />
  );
};

export default Backdrop;