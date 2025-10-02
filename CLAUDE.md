# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SAER TI Frontend is a React-based financial management dashboard for cost center administration, expenses tracking, and income management. Built with TypeScript, Vite, and Tailwind CSS.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server (runs on port 5173)
- `npm run build` - Build for production (runs TypeScript compilation then Vite build)
- `npm run lint` - Lint code with ESLint
- `npm run preview` - Preview production build

### Backend Configuration
- Backend API runs on `http://localhost:3001`
- Frontend proxies `/api` requests to backend via Vite proxy configuration
- Uses JWT authentication stored in localStorage as `auth_token`

## Architecture Overview

### Core Structure
- **React 19** with TypeScript and functional components
- **Context-based state management** (AuthContext, ThemeContext, SidebarContext, TenantContext)
- **Protected routing** with PrivateRoute component wrapping authenticated pages
- **Service layer** with centralized API client and domain-specific services
- **Component hierarchy**: UI components → Feature components → Pages → Layout

### Key Patterns
- All API calls use the centralized `apiService.ts` with axios interceptors for auth
- Route structure follows `/costos/*` for costs, `/ingresos/*` for income, `/cost-centers/*` for cost centers
- Context providers wrap the app: ThemeProvider > AuthProvider > Router > AppLayout
- Responsive sidebar that collapses on mobile with backdrop overlay

### Authentication Flow
- JWT tokens managed by `authService.ts` with automatic refresh
- `AuthContext` provides user state and auth methods across components
- Token expiration handled by axios interceptors (auto-refresh or redirect to login)
- Protected routes check authentication status before rendering

### Data Management
- Services organized by domain: `costsService`, `ingresosService`, `projectService`, etc.
- API responses follow consistent patterns with success/error handling
- File uploads handled via `postFormData` method for multipart content
- TypeScript interfaces define all API contracts in `/types` directory

### Styling & UI
- Tailwind CSS with dark/light theme support via ThemeContext
- Component library in `/components/ui` with reusable elements
- Form components with consistent validation patterns
- ApexCharts for data visualization, Flatpickr for date picking

### Key Directories
- `src/pages/` - Page components organized by feature (Dashboard, Costs, Income, etc.)
- `src/services/` - API services and business logic
- `src/context/` - React context providers for global state
- `src/components/` - Reusable components organized by type (ui, form, charts, etc.)
- `src/hooks/` - Custom React hooks for data fetching and state management
- `src/types/` - TypeScript type definitions

### Development Notes
- Uses @ path alias pointing to /src for imports
- ESLint configured with React hooks rules, unused vars disabled
- Vite config includes SVG-as-React-component support via vite-plugin-svgr
- Hot reload enabled for development with network access for external testing