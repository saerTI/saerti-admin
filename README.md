# SAER TI - Frontend

Dashboard administrativo moderno construido con React.js para el sistema de gestión empresarial SAER TI.

## Descripción

SAER TI Frontend es una aplicación web moderna que proporciona una interfaz de usuario intuitiva y responsiva para el sistema de gestión empresarial SAER TI, incluyendo:

- **Dashboard Ejecutivo**: Visualización de métricas y KPIs empresariales
- **Gestión de Usuarios**: Interface para administración de usuarios y perfiles
- **Análisis Financiero**: Gráficos interactivos y reportes financieros
- **Centros de Costo**: Visualización y gestión de centros de costo
- **Responsive Design**: Adaptado para desktop, tablet y móvil

## Tecnologías Utilizadas

- **React.js 19**: Framework principal
- **TypeScript**: Tipado estático
- **Vite**: Build tool y desarrollo
- **React Router**: Navegación
- **Context API**: Manejo de estado global
- **Axios**: Cliente HTTP
- **ApexCharts**: Visualización de datos
- **CSS Modules**: Estilos modulares

## Requisitos del Sistema

- **Node.js**: v18.x o superior (recomendado v20.x)
- **npm**: v8.x o superior
- **Navegador moderno**: Chrome, Firefox, Safari, Edge

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/saerTI/saer-frontend.git
cd saer-frontend
```

> **Nota para Windows**: Coloca el repositorio cerca de la raíz de tu unidad si encuentras problemas al clonar.

### 2. Instalar Dependencias

```bash
npm install
```

> **Nota**: Usa la bandera `--legacy-peer-deps` si encuentras problemas durante la instalación:
```bash
npm install --legacy-peer-deps
```

### 3. Configuración de Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# URL del backend API
VITE_API_URL=http://localhost:3000/api

# Configuración de desarrollo
VITE_NODE_ENV=development

# Configuración de autenticación
VITE_JWT_STORAGE_KEY=saer_ti_token
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

## Scripts Disponibles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de la build de producción
npm run preview

# Linting del código
npm run lint

# Verificar tipos de TypeScript
npm run type-check
```

## Estructura del Proyecto

```
saer-frontend/
├── public/              # Archivos públicos estáticos
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── common/     # Componentes comunes
│   │   ├── charts/     # Componentes de gráficos
│   │   ├── form/       # Componentes de formularios
│   │   ├── tables/     # Componentes de tablas
│   │   └── ...
│   ├── pages/          # Páginas de la aplicación
│   │   ├── Dashboard/  # Páginas del dashboard
│   │   ├── Charts/     # Páginas de gráficos
│   │   ├── Forms/      # Páginas de formularios
│   │   ├── Tables/     # Páginas de tablas
│   │   └── ...
│   ├── context/        # Context providers
│   ├── services/       # Servicios API
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utilidades
│   ├── types/          # Definiciones de tipos
│   ├── styles/         # Estilos globales
│   ├── App.tsx         # Componente raíz
│   └── main.tsx        # Punto de entrada
├── package.json        # Dependencias y scripts
└── vite.config.ts      # Configuración de Vite
```

## Características Principales

### Dashboard Interactivo
- Métricas empresariales en tiempo real
- Gráficos interactivos con ApexCharts
- Widgets configurables
- Diseño responsivo

### Sistema de Autenticación
- Login/logout con JWT
- Gestión de sesiones
- Rutas protegidas
- Recuperación de contraseña

### Gestión de Usuarios
- CRUD completo de usuarios
- Gestión de roles y permisos
- Perfiles de usuario editables
- Estados de usuario activo/inactivo

### Visualización de Datos
- Gráficos de líneas, barras y áreas
- Tablas interactivas con filtros
- Exportación de datos
- Análisis multidimensional

## Configuración del Backend

Para que el frontend funcione correctamente, asegúrate de que el backend esté ejecutándose:

1. **Backend corriendo**: `http://localhost:3000`
2. **CORS configurado**: El backend debe permitir peticiones desde `http://localhost:5173`
3. **API endpoints**: Verifica que todos los endpoints estén disponibles

## Desarrollo

### Agregar Nuevas Páginas

1. Crear el componente en `src/pages/`
2. Agregar la ruta en el router principal
3. Actualizar la navegación si es necesario

### Agregar Nuevos Componentes

1. Crear el componente en `src/components/`
2. Exportar desde el index correspondiente
3. Importar donde sea necesario

### Manejo de Estado

El proyecto utiliza Context API para el manejo de estado global:

```typescript
// Ejemplo de uso del contexto de autenticación
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, login, logout } = useAuth();
  // ...
};
```

### Llamadas a la API

Usa el servicio de API configurado:

```typescript
import { apiService } from '../services/apiService';

const fetchData = async () => {
  try {
    const response = await apiService.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Build para Producción

```bash
# Generar build optimizada
npm run build

# Los archivos se generarán en la carpeta 'dist/'
```

### Despliegue

1. **Servidor Web**: Sirve los archivos estáticos desde `dist/`
2. **Variables de Entorno**: Configura las variables de producción
3. **HTTPS**: Recomendado para producción
4. **Proxy Reverso**: Configura nginx o Apache para servir la aplicación

#### Ejemplo de configuración Nginx:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Solución de Problemas

### Problemas Comunes

**Error de CORS:**
- Verifica que el backend permita peticiones desde el dominio del frontend
- Configura las variables de entorno correctamente

**Error 404 en rutas:**
- Configura el servidor web para servir `index.html` en todas las rutas
- Verifica la configuración del router

**Problemas de build:**
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar versión de Node.js
node --version
```

**Problemas con TypeScript:**
```bash
# Verificar tipos
npm run type-check

# Limpiar caché de TypeScript
npx tsc --build --clean
```

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

### Estándares de Código

- Usar TypeScript para tipado estático
- Seguir las convenciones de naming de React
- Escribir componentes funcionales con hooks
- Mantener componentes pequeños y reutilizables
- Documentar componentes complejos

## Testing

```bash
# Ejecutar tests (cuando estén configurados)
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## Performance

### Optimizaciones Implementadas

- **Code Splitting**: Carga lazy de rutas
- **Tree Shaking**: Eliminación de código no utilizado
- **Minificación**: Archivos optimizados para producción
- **Compresión**: Assets comprimidos automáticamente

### Métricas de Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## Soporte

Para reportar bugs o solicitar nuevas funcionalidades, por favor crear un issue en el repositorio de GitHub.
