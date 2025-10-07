// App.tsx FINAL - Integrado con ClerkProtectedRoute
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkTokenGetter } from "./services/apiService";
import { AuthProvider } from "./context/AuthContext";
import ClerkProtectedRoute from "./components/auth/ClerkProtectedRoute";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import CashFlow from "./pages/CashFlow/CashFlow";
import { ProjectDetails, ProjectForm, ProjectList } from "./pages/Projects";
import Cotizaciones from "./pages/Costs/Cotizaciones";
import Previsionales from "./pages/Costs/Previsionales";
import SubcontratosCredito from "./pages/Costs/SubcontratosCredito";
import SubcontratosContado from "./pages/Costs/SubcontratosContado";
import Remuneraciones from "./pages/Costs/Remuneraciones";
import GastosImprevistos from "./pages/Costs/GastosImprevistos";
import OrdenesCompra from "./pages/Costs/OrdenesCompra";
import EgresossIndex from "./pages/Costs/CostsIndex";
import Factoring from "./pages/Costs/Factoring";
import CostosFijos from "./pages/Costs/CostosFijos";
import { RemuneracionesDetail } from "./pages/Costs/RemuneracionesDetail";
import RemuneracionesForm from "./pages/Costs/RemuneracionesForm";
import OrdenCompraDetail from "./pages/Costs/OrdenCompraDetail";
import { CostosFijosDetail } from "./pages/Costs/CostosFijosDetail";
import Empleados from "./pages/Costs/Empleados";
import EmpleadosNuevo from "./pages/Costs/EmpleadosNuevo";
import EmpleadosDetalle from "./pages/Costs/EmpleadosDetalle";
import EmpleadosEdición from "./pages/Costs/EmpleadosEdicion";
import { CostosFijosEdicion } from "./pages/Costs/CostosFijosEdicion";
import { BudgetAnalyzer } from "./components/BudgetAnalyzer/BudgetAnalyzer";
import OrdenCompraForm from "./pages/Costs/OrdenCompraForm";
import OrdenCompraEdicion from "./pages/Costs/OrdenCompraEdicion";
import { IngresosForm } from "./pages/Ingresos/IngresosForm";
import IngresosFormDetail from "./pages/Ingresos/IngresosDetail";
import IngresosCategoryDetail from "./pages/Ingresos/IngresosCategoryDetail";
import IngresosIndex from "./pages/Ingresos/IngresosIndex";

// ✅ Componente que configura el token getter para apiService
function ClerkTokenProvider() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Configurar la función que obtiene tokens para apiService
      setClerkTokenGetter(async () => {
        try {
          const token = await getToken();
          
          if (token) {
            console.log('[ClerkTokenProvider] ✅ Token obtenido:', {
              tokenPrefix: token.substring(0, 30) + '...',
              userId
            });
            return token;
          } else {
            console.error('[ClerkTokenProvider] ❌ getToken() devolvió null');
            return null;
          }
        } catch (error) {
          console.error('[ClerkTokenProvider] ❌ Error obteniendo token:', error);
          return null;
        }
      });

      console.log('[ClerkTokenProvider] Token getter configurado correctamente');
    }
  }, [getToken, isLoaded, isSignedIn, userId]);

  return null;
}

// Pantalla de carga mientras Clerk inicializa
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Inicializando aplicación...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { isLoaded } = useAuth();

  // Mientras Clerk está cargando
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Configurar token getter */}
      <ClerkTokenProvider />
      
      <Router>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Protected Dashboard Layout */}
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path="/" element={
                <ClerkProtectedRoute>
                  <Home />
                </ClerkProtectedRoute>
              } />
              
              {/* Cash Flow */}
              <Route path="/cash-flow" element={
                <ClerkProtectedRoute>
                  <CashFlow />
                </ClerkProtectedRoute>
              } />

              {/* Centros de Costo */}
              <Route path="/cost-centers" element={
                <ClerkProtectedRoute>
                  <ProjectList />
                </ClerkProtectedRoute>
              } />
              <Route path="/cost-centers/new" element={
                <ClerkProtectedRoute>
                  <ProjectForm />
                </ClerkProtectedRoute>
              } />
              <Route path="/cost-centers/:id" element={
                <ClerkProtectedRoute>
                  <ProjectDetails />
                </ClerkProtectedRoute>
              } />
              <Route path="/cost-centers/:id/edit" element={
                <ClerkProtectedRoute>
                  <ProjectForm />
                </ClerkProtectedRoute>
              } />

              {/* Budget Analyzer */}
              <Route path="/budget-analysis" element={
                <ClerkProtectedRoute>
                  <BudgetAnalyzer />
                </ClerkProtectedRoute>
              } />

              {/* Costos - Index */}
              <Route path="/costos" element={
                <ClerkProtectedRoute>
                  <EgresossIndex />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/index" element={
                <ClerkProtectedRoute>
                  <EgresossIndex />
                </ClerkProtectedRoute>
              } />

              {/* Costos Fijos */}
              <Route path="/costos/costos-fijos" element={
                <ClerkProtectedRoute>
                  <CostosFijos />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/costos-fijos/:id" element={
                <ClerkProtectedRoute>
                  <CostosFijosDetail />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/costos-fijos/:id/edit" element={
                <ClerkProtectedRoute>
                  <CostosFijosEdicion />
                </ClerkProtectedRoute>
              } />

              {/* Empleados */}
              <Route path="/costos/empleados" element={
                <ClerkProtectedRoute>
                  <Empleados />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/empleados/new" element={
                <ClerkProtectedRoute>
                  <EmpleadosNuevo />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/empleados/:id" element={
                <ClerkProtectedRoute>
                  <EmpleadosDetalle />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/empleados/:id/edit" element={
                <ClerkProtectedRoute>
                  <EmpleadosEdición />
                </ClerkProtectedRoute>
              } />

              {/* Otros Costos */}
              <Route path="/costos/cotizaciones" element={
                <ClerkProtectedRoute>
                  <Cotizaciones />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/previsionales" element={
                <ClerkProtectedRoute>
                  <Previsionales />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/remuneraciones" element={
                <ClerkProtectedRoute>
                  <Remuneraciones />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/remuneraciones/:id" element={
                <ClerkProtectedRoute>
                  <RemuneracionesDetail />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/remuneraciones/:id/edit" element={
                <ClerkProtectedRoute>
                  <RemuneracionesForm />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/subcontratos-credito" element={
                <ClerkProtectedRoute>
                  <SubcontratosCredito />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/subcontratos-contado" element={
                <ClerkProtectedRoute>
                  <SubcontratosContado />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/imprevistos" element={
                <ClerkProtectedRoute>
                  <GastosImprevistos />
                </ClerkProtectedRoute>
              } />
              
              {/* Órdenes de Compra */}
              <Route path="/costos/ordenes-compra" element={
                <ClerkProtectedRoute>
                  <OrdenesCompra />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/ordenes-compra/new" element={
                <ClerkProtectedRoute>
                  <OrdenCompraForm />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/ordenes-compra/:id" element={
                <ClerkProtectedRoute>
                  <OrdenCompraDetail />
                </ClerkProtectedRoute>
              } />
              <Route path="/costos/ordenes-compra/:id/edit" element={
                <ClerkProtectedRoute>
                  <OrdenCompraEdicion />
                </ClerkProtectedRoute>
              } />
              
              <Route path="/costos/factoring" element={
                <ClerkProtectedRoute>
                  <Factoring />
                </ClerkProtectedRoute>
              } />

              {/* Ingresos */}
              <Route path="/ingresos" element={
                <ClerkProtectedRoute>
                  <IngresosIndex />
                </ClerkProtectedRoute>
              } />
              <Route path="/ingresos/index" element={
                <ClerkProtectedRoute>
                  <IngresosIndex />
                </ClerkProtectedRoute>
              } />
              <Route path="/ingresos/new" element={
                <ClerkProtectedRoute>
                  <IngresosForm />
                </ClerkProtectedRoute>
              } />
              <Route path="/ingresos/categoria/:category" element={
                <ClerkProtectedRoute>
                  <IngresosCategoryDetail />
                </ClerkProtectedRoute>
              } />
              <Route path="/ingresos/:id" element={
                <ClerkProtectedRoute>
                  <IngresosFormDetail />
                </ClerkProtectedRoute>
              } />
              <Route path="/ingresos/editar/:id" element={
                <ClerkProtectedRoute>
                  <IngresosForm />
                </ClerkProtectedRoute>
              } />

              {/* Profile & Other Pages */}
              <Route path="/profile" element={
                <ClerkProtectedRoute>
                  <UserProfiles />
                </ClerkProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ClerkProtectedRoute>
                  <Calendar />
                </ClerkProtectedRoute>
              } />
              <Route path="/blank" element={
                <ClerkProtectedRoute>
                  <Blank />
                </ClerkProtectedRoute>
              } />
              
              {/* Forms */}
              <Route path="/form-elements" element={
                <ClerkProtectedRoute>
                  <FormElements />
                </ClerkProtectedRoute>
              } />
              
              {/* Tables */}
              <Route path="/basic-tables" element={
                <ClerkProtectedRoute>
                  <BasicTables />
                </ClerkProtectedRoute>
              } />
              
              {/* UI Elements */}
              <Route path="/alerts" element={
                <ClerkProtectedRoute>
                  <Alerts />
                </ClerkProtectedRoute>
              } />
              <Route path="/avatars" element={
                <ClerkProtectedRoute>
                  <Avatars />
                </ClerkProtectedRoute>
              } />
              <Route path="/badge" element={
                <ClerkProtectedRoute>
                  <Badges />
                </ClerkProtectedRoute>
              } />
              <Route path="/buttons" element={
                <ClerkProtectedRoute>
                  <Buttons />
                </ClerkProtectedRoute>
              } />
              <Route path="/images" element={
                <ClerkProtectedRoute>
                  <Images />
                </ClerkProtectedRoute>
              } />
              <Route path="/videos" element={
                <ClerkProtectedRoute>
                  <Videos />
                </ClerkProtectedRoute>
              } />
              
              {/* Charts */}
              <Route path="/line-chart" element={
                <ClerkProtectedRoute>
                  <LineChart />
                </ClerkProtectedRoute>
              } />
              <Route path="/bar-chart" element={
                <ClerkProtectedRoute>
                  <BarChart />
                </ClerkProtectedRoute>
              } />
            </Route>
            
            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}