// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantContext";
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
import OdooInitializer from "./components/common/OdooInitializer";

export default function App() {
  return (
    <TenantProvider>
      <Router>
        <AuthProvider>
          <OdooInitializer>
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
          </OdooInitializer>
        </AuthProvider>
      </Router>
    </TenantProvider>
  );
}