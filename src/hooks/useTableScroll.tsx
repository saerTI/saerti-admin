// src/hooks/useTableScroll.ts
import { useRef, useEffect } from 'react';

/**
 * Hook to enable horizontal scrolling on a table when using the mouse wheel
 * Works with or without Lenis for smooth scrolling
 * 
 * @param enableSmooth Whether to use smooth scrolling (default: false)
 * @returns A ref to attach to the scrollable container
 */
export const useTableScroll = (enableSmooth: boolean = false) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      // Check if the table needs horizontal scrolling
      if (container.scrollWidth <= container.clientWidth) return;
      
      // Don't intercept if the user is holding shift (browser handles horizontal scroll naturally)
      if (e.shiftKey) return;
      
      // If the user is not specifically trying to scroll horizontally and
      // we have some horizontal scroll available, prevent default and scroll horizontally
      if (
        (container.scrollLeft > 0 || e.deltaY > 0) && 
        (container.scrollLeft < container.scrollWidth - container.clientWidth || e.deltaY < 0)
      ) {
        e.preventDefault();
        
        const scrollAmount = e.deltaY;
        
        if (enableSmooth) {
          // Smooth scrolling implementation
          const startTime = performance.now();
          const startScrollLeft = container.scrollLeft;
          const duration = 300; // milliseconds
          
          const animateScroll = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            
            container.scrollLeft = startScrollLeft + scrollAmount * easeProgress;
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };
          
          requestAnimationFrame(animateScroll);
        } else {
          // Immediate scrolling
          container.scrollLeft += scrollAmount;
        }
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [enableSmooth]);
  
  return scrollContainerRef;
};

export default useTableScroll;