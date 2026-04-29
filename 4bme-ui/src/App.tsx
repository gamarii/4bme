import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import AppShell from "./components/layout/Appshell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SignUpPage from "./pages/SignUpPage";
import DevicesPage from "./pages/DevicesPage";
import DeviceDetailsPage from "./pages/DeviceDetailsPage";
import WorkOrdersPage from "./pages/WorkOrdersPage";
import WorkOrderDetailsPage from "./pages/WorkOrderDetailsPage";
import AssignmentRecommendationsPage from "./pages/AssignmentRecommendationsPage";
import SchedulePage from "./pages/SchedulePage";
import AuditLogsPage from "./pages/AuditLogsPage";
import PredictiveAlertsPage from "./pages/PredictiveAlertsPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="predictive-alerts" element={<PredictiveAlertsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          {/* <Route path="settings" element={<DashboardPage />} /> */}
          <Route path="devices" element={<DevicesPage />} />
          <Route path="devices/:deviceId" element={<DeviceDetailsPage />} />
          <Route path="work-orders" element={<WorkOrdersPage />} />
          <Route path="work-orders/:workOrderId" element={<WorkOrderDetailsPage />} />
          <Route path="recommendations" element={<AssignmentRecommendationsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}