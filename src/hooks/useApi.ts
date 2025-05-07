// src/hooks/useApi.ts
import { useEffect, useState, useRef } from 'react';

// Caché simple a nivel de aplicación
const apiCache = new Map();

// Tipo para la respuesta del hook
export interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>; // Función para refrescar los datos
}

/**
 * Hook para realizar llamadas a la API con caché para evitar duplicación
 * @param apiCall - Función que realiza la llamada a la API
 * @param cacheKey - Clave única para almacenar en caché
 * @param dependencies - Dependencias que provocan una recarga
 * @param skipCache - Si es true, ignora la caché y realiza una nueva llamada
 */
export function useApi<T>(
  apiCall: () => Promise<T>, 
  cacheKey: string, 
  dependencies: any[] = [],
  skipCache: boolean = false
): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Usamos un ref para rastrear si el componente sigue montado
  const isMounted = useRef(true);
  
  // Función para realizar la llamada a la API
  const fetchData = async (ignoreCache: boolean = false) => {
    // Si hay datos en caché y no se debe ignorar la caché, usar esos datos
    if (!ignoreCache && apiCache.has(cacheKey)) {
      setData(apiCache.get(cacheKey));
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const result = await apiCall();
      
      // Solo actualizar estado y caché si el componente sigue montado
      if (isMounted.current) {
        apiCache.set(cacheKey, result);
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Error in useApi hook:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  
  // Función para refrescar los datos (ignorando la caché)
  const refresh = async () => {
    await fetchData(true);
  };
  
  // Efecto para cargar los datos
  useEffect(() => {
    // Restablecer el montado a true cuando cambian las dependencias
    isMounted.current = true;
    
    // Cargar datos con o sin caché según skipCache
    fetchData(skipCache);
    
    // Limpieza: marcar como desmontado cuando el componente se desmonta
    return () => {
      isMounted.current = false;
    };
  }, dependencies);  // eslint-disable-line react-hooks/exhaustive-deps
  
  return { data, loading, error, refresh };
}

// Función para limpiar la caché (útil para logout, por ejemplo)
export const clearApiCache = () => {
  apiCache.clear();
};

// Función para eliminar entradas específicas de la caché
export const removeFromApiCache = (keyPattern: string | RegExp) => {
  if (typeof keyPattern === 'string') {
    // Si es una cadena exacta, eliminar esa entrada
    apiCache.delete(keyPattern);
  } else {
    // Si es un RegExp, eliminar todas las entradas que coincidan
    const keysToRemove = Array.from(apiCache.keys()).filter(key => 
      keyPattern.test(key.toString())
    );
    
    keysToRemove.forEach(key => apiCache.delete(key));
  }
};

export default useApi;