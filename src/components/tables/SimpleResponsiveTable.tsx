import React, { ReactNode, useRef, useEffect } from 'react';
import './table-styles.css';

// Interfaz actualizada con todas las propiedades necesarias
export interface SimpleResponsiveTableProps {
  children: ReactNode;
  hasData: boolean;
  emptyMessage?: string;
  enableSmoothScroll?: boolean;
  className?: string;
  useGsap?: boolean;
}

const SimpleResponsiveTable: React.FC<SimpleResponsiveTableProps> = ({
  children,
  hasData,
  emptyMessage = "No se encontraron datos.",
  enableSmoothScroll = false,
  className = "",
  useGsap = false
}) => {
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Efecto para aplicar clase a las filas para manejar hover correctamente
  useEffect(() => {
    if (!tableWrapperRef.current) return;

    // Agregamos una clase específica a cada fila para manejar mejor el hover
    const tableBody = tableWrapperRef.current.querySelector('tbody');
    if (tableBody) {
      const rows = tableBody.querySelectorAll('tr');
      rows.forEach(row => {
        // Removemos todas las clases de hover problemáticas de Tailwind
        row.classList.remove(
          'hover:bg-gray-50', 
          'dark:hover:bg-white/[0.05]',
          'hover:bg-white/[0.05]'
        );
        
        // Removemos clases con patrones problemáticos
        const classList = Array.from(row.classList);
        classList.forEach(className => {
          if (className.includes('hover:bg-white') || 
              className.includes('dark:hover:bg-white')) {
            row.classList.remove(className);
          }
        });
        
        // Agregamos nuestra clase personalizada
        row.classList.add('table-row-with-hover');
      });
    }
  }, [children]); // Dependencia en children para re-aplicar cuando cambien los datos

  // Manejador de scroll horizontal nativo
  useEffect(() => {
    if (!enableSmoothScroll || !tableWrapperRef.current || useGsap) return;
    
    const handleWheel = (e: WheelEvent) => {
      const wrapper = tableWrapperRef.current!;
      const hasHorizontalScroll = wrapper.scrollWidth > wrapper.clientWidth;
      
      // Solo procesamos el evento si hay scroll horizontal
      if (!hasHorizontalScroll) return;
      
      // Determinamos si es un intento de scroll horizontal
      const isHorizontalScrollAttempt = 
        Math.abs(e.deltaX) > Math.abs(e.deltaY) || // Movimiento principalmente horizontal
        e.shiftKey; // O la tecla shift está presionada
      
      if (isHorizontalScrollAttempt) {
        e.preventDefault();
        const scrollAmount = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        wrapper.scrollLeft += scrollAmount;
      }
    };

    const tableWrapper = tableWrapperRef.current;
    tableWrapper.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      tableWrapper.removeEventListener('wheel', handleWheel);
    };
  }, [enableSmoothScroll, useGsap]);

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden ${className}`}>
      <div 
        ref={tableWrapperRef} 
        className="responsive-table-wrapper"
      >
        {children}
      </div>
    </div>
  );
};

export default SimpleResponsiveTable;