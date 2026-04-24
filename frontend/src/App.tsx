import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router";
import { useGlobalUnauthorizedHandler } from "@/features/auth/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/routes/auth/LoginPage";
import { SignupPage } from "@/routes/auth/SignupPage";
import { SessionsListPage } from "@/routes/sessions/SessionsListPage";
import { RoutinesListPage } from "@/routes/routines/RoutinesListPage";
import { ProgressPage } from "@/routes/progress/ProgressPage";
import { BodyPage } from "@/routes/body/BodyPage";

function AppRoutes() {
  const navigate = useNavigate();
  useGlobalUnauthorizedHandler(() => navigate("/login", { replace: true }));

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/sessions" replace />} />
        <Route path="/sessions" element={<SessionsListPage />} />
        <Route path="/routines" element={<RoutinesListPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/body" element={<BodyPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/sessions" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
