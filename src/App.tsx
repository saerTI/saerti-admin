// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
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

// Import placeholder components for Gastos pages
// These will need to be created
import Cotizaciones from "./pages/Costs/Cotizaciones";
import Previsionales from "./pages/Costs/Previsionales";
import SubcontratosCredito from "./pages/Costs/SubcontratosCredito";
import SubcontratosContado from "./pages/Costs/SubcontratosContado";
import Remuneraciones from "./pages/Costs/Remuneraciones";
import GastosImprevistos from "./pages/Costs/GastosImprevistos";
import OrdenesCompra from "./pages/Costs/OrdenesCompra";
import EgresossIndex from "./pages/Costs/CostsIndex";
import IngresosIndex from "./pages/Ingresos/IngresosIndex";
import Factoring from "./pages/Costs/Factoring";
import CostosFijos from "./pages/Costs/CostosFijos";

// import ServiciosAlimentacionHospedaje from "./pages/Gastos/ServiciosAlimentacionHospedaje";
// import LeasingPagosMaquinaria from "./pages/Gastos/LeasingPagosMaquinaria";
// import ContratosNotariales from "./pages/Gastos/ContratosNotariales";
// import CostosFijos from "./pages/Gastos/CostosFijos";
// import CostosVariables from "./pages/Gastos/CostosVariables";
// import PagoRendiciones from "./pages/Gastos/PagoRendiciones";
// import Impuestos from "./pages/Gastos/Impuestos";
// import SegurosPolizas from "./pages/Gastos/SegurosPolizas";
// import CertificacionesCapacitaciones from "./pages/Gastos/CertificacionesCapacitaciones";
// import EstudiosAsesorias from "./pages/Gastos/EstudiosAsesorias";
// import OCContado from "./pages/Gastos/OCContado";


export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          
          {/* Protected Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            
            {/* Cash Flow - protected route */}
            <Route path="/cash-flow" element={
              <PrivateRoute>
                <CashFlow />
              </PrivateRoute>
            } />

            {/* Rutas de Proyectos */}
            <Route path="/projects" element={
              <PrivateRoute>
                <ProjectList />
              </PrivateRoute>
            } />
            <Route path="/projects/new" element={
              <PrivateRoute>
                <ProjectForm />
              </PrivateRoute>
            } />
            <Route path="/projects/:id" element={
              <PrivateRoute>
                <ProjectDetails />
              </PrivateRoute>
            } />
            <Route path="/projects/:id/edit" element={
              <PrivateRoute>
                <ProjectForm />
              </PrivateRoute>
            } />
            
            {/* Rutas de Gastos */}
            <Route path="/gastos/index" element={
              <PrivateRoute>
                <EgresossIndex />
              </PrivateRoute>
            } />

            <Route path="/gastos/cotizaciones" element={
              <PrivateRoute>
                <Cotizaciones />
              </PrivateRoute>
            } />
            <Route path="/gastos/previsionales" element={
              <PrivateRoute>
                <Previsionales />
              </PrivateRoute>
            } />
            <Route path="/gastos/remuneraciones" element={
              <PrivateRoute>
                <Remuneraciones />
              </PrivateRoute>
            } />
            <Route path="/gastos/subcontratos-credito" element={
              <PrivateRoute>
                <SubcontratosCredito />
              </PrivateRoute>
            } />
            <Route path="/gastos/subcontratos-contado" element={
              <PrivateRoute>
                <SubcontratosContado />
              </PrivateRoute>
            } />
            <Route path="/gastos/imprevistos" element={
              <PrivateRoute>
                <GastosImprevistos />
              </PrivateRoute>
            } />
            <Route path="/gastos/ordenes-compra" element={
              <PrivateRoute>
                <OrdenesCompra />
              </PrivateRoute>
            } />
            <Route path="/gastos/factoring" element={
              <PrivateRoute>
                <Factoring />
              </PrivateRoute>
            } />
            

            <Route path="/gastos/costos-fijos" element={
              <PrivateRoute>
                <CostosFijos />
              </PrivateRoute>
            } />

            {/* <Route path="/gastos/oc-contado" element={
              <PrivateRoute>
                <OCContado />
              </PrivateRoute>
            } />
            <Route path="/gastos/servicios-alimentacion-hospedaje" element={
              <PrivateRoute>
                <ServiciosAlimentacionHospedaje />
              </PrivateRoute>
            } />
            <Route path="/gastos/leasing-pagos-maquinaria" element={
              <PrivateRoute>
                <LeasingPagosMaquinaria />
              </PrivateRoute>
            } />
            <Route path="/gastos/contratos-notariales" element={
              <PrivateRoute>
                <ContratosNotariales />
              </PrivateRoute>
            } />
            
            <Route path="/gastos/costos-variables" element={
              <PrivateRoute>
                <CostosVariables />
              </PrivateRoute>
            } />
            <Route path="/gastos/pago-rendiciones" element={
              <PrivateRoute>
                <PagoRendiciones />
              </PrivateRoute>
            } />
            <Route path="/gastos/impuestos" element={
              <PrivateRoute>
                <Impuestos />
              </PrivateRoute>
            } />
            <Route path="/gastos/seguros-polizas" element={
              <PrivateRoute>
                <SegurosPolizas />
              </PrivateRoute>
            } />
            <Route path="/gastos/certificaciones-capacitaciones" element={
              <PrivateRoute>
                <CertificacionesCapacitaciones />
              </PrivateRoute>
            } />
            <Route path="/gastos/estudios-asesorias" element={
              <PrivateRoute>
                <EstudiosAsesorias />
              </PrivateRoute>
            } /> */}

            {/* Rutas de Ingresos */}
            <Route path="/ingresos/index" element={
              <PrivateRoute>
                <IngresosIndex />
              </PrivateRoute>
            } />
            
            {/* Other protected routes */}
            <Route path="/profile" element={
              <PrivateRoute>
                <UserProfiles />
              </PrivateRoute>
            } />
            <Route path="/calendar" element={
              <PrivateRoute>
                <Calendar />
              </PrivateRoute>
            } />
            <Route path="/blank" element={
              <PrivateRoute>
                <Blank />
              </PrivateRoute>
            } />
            
            {/* Forms */}
            <Route path="/form-elements" element={
              <PrivateRoute>
                <FormElements />
              </PrivateRoute>
            } />
            
            {/* Tables */}
            <Route path="/basic-tables" element={
              <PrivateRoute>
                <BasicTables />
              </PrivateRoute>
            } />
            
            {/* Ui Elements */}
            <Route path="/alerts" element={
              <PrivateRoute>
                <Alerts />
              </PrivateRoute>
            } />
            <Route path="/avatars" element={
              <PrivateRoute>
                <Avatars />
              </PrivateRoute>
            } />
            <Route path="/badge" element={
              <PrivateRoute>
                <Badges />
              </PrivateRoute>
            } />
            <Route path="/buttons" element={
              <PrivateRoute>
                <Buttons />
              </PrivateRoute>
            } />
            <Route path="/images" element={
              <PrivateRoute>
                <Images />
              </PrivateRoute>
            } />
            <Route path="/videos" element={
              <PrivateRoute>
                <Videos />
              </PrivateRoute>
            } />
            
            {/* Charts */}
            <Route path="/line-chart" element={
              <PrivateRoute>
                <LineChart />
              </PrivateRoute>
            } />
            <Route path="/bar-chart" element={
              <PrivateRoute>
                <BarChart />
              </PrivateRoute>
            } />
          </Route>
          
          {/* Redirect /signin to /auth/signin for compatibility */}
          <Route path="/signin" element={<Navigate to="/auth/signin" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}