## Frontend (React)

- **Componentes:**
    - Usa **componentes funcionales con Hooks** (`useState`, `useEffect`, `useContext`, etc.). Evita los componentes de clase.
    - Desestructura las props y dales tipos.
    - Mantén los componentes pequeños y enfocados en una sola responsabilidad (principio SRP).

- **Estado:**
    - Para el estado local de los componentes, usa `useState`.
    - Para estados complejos o que involucran múltiples sub-valores, utiliza `useReducer`.

- **Estilos:**
    - La metodología para los estilos es **CSS Modules**. No uses CSS en línea (inline styles) a menos que sea estrictamente necesario para estilos dinámicos.

- **Comunicación con el Backend:**
    - Utiliza la librería **Axios** para todas las peticiones a la API.
    - Crea una instancia de Axios centralizada con la URL base de la API y cualquier configuración necesaria.
    - Maneja siempre los estados de carga (`loading`), éxito (`success`) y error (`error`) en las llamadas asíncronas.

- **Buenas Prácticas:**
    - Usa **TypeScript** en lugar de JavaScript simple para mejorar la robustez del código.
    - Implementa `React.lazy` y `Suspense` para la carga diferida (lazy loading) de componentes pesados.


- **Lenguaje y Comentarios:** Escribe todo el código y los comentarios en español.
- **Formato:** Utiliza Prettier para formatear el código, asegurando una consistencia visual en todo el proyecto.
- **Nombres:** Las variables, funciones y componentes deben tener nombres descriptivos y claros.
- **Git:** Los mensajes de commit deben seguir la convención de "Conventional Commits" (ej: `feat: agrega login de usuario`).
