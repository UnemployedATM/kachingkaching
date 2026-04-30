import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import StudioSetup from './pages/StudioSetup';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import Bookings from './pages/Bookings';
import Calendar from './pages/Calendar';
import Payments from './pages/Payments';
import ClientProfile from './pages/ClientProfile';
import FloorPlan from './pages/FloorPlan';
import Classes from './pages/Classes';
import Memberships from './pages/Memberships';
import Settings from './pages/Settings';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const AppRoutes = () => {
  const { isLoadingAuth, isAuthenticated, needsStudioSetup } = useAuth();

  if (isLoadingAuth) return <Spinner />;

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/setup"
        element={
          !isAuthenticated    ? <Navigate to="/login" replace /> :
          !needsStudioSetup   ? <Navigate to="/" replace />      :
          <StudioSetup />
        }
      />
      <Route
        path="/*"
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> :
          <AuthenticatedRoutes />
        }
      />
    </Routes>
  );
};

const AuthenticatedRoutes = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/"             element={<Dashboard />} />
      <Route path="/calendar"     element={<Calendar />} />
      <Route path="/bookings"     element={<Bookings />} />
      <Route path="/clients"      element={<Clients />} />
      <Route path="/clients/:id"  element={<ClientProfile />} />
      <Route path="/inventory"    element={<Inventory />} />
      <Route path="/payments"     element={<Payments />} />
      <Route path="/floor-plan"   element={<FloorPlan />} />
      <Route path="/classes"      element={<Classes />} />
      <Route path="/memberships"  element={<Memberships />} />
      <Route path="/settings"     element={<Settings />} />
    </Route>
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
