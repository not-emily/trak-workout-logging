import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router";
import { useGlobalUnauthorizedHandler } from "@/features/auth/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/routes/auth/LoginPage";
import { SignupPage } from "@/routes/auth/SignupPage";
import { SessionsListPage } from "@/routes/sessions/SessionsListPage";
import { ActiveSessionPage } from "@/routes/sessions/ActiveSessionPage";
import { RetroactiveSessionPage } from "@/routes/sessions/RetroactiveSessionPage";
import { RoutinesListPage } from "@/routes/routines/RoutinesListPage";
import { RoutineDetailPage } from "@/routes/routines/RoutineDetailPage";
import { ProgressPage } from "@/routes/progress/ProgressPage";
import { ExerciseProgressPage } from "@/routes/progress/ExerciseProgressPage";
import { BodyPage } from "@/routes/body/BodyPage";
import { MetricDetailPage } from "@/routes/body/MetricDetailPage";
import { GoalsListPage } from "@/routes/goals/GoalsListPage";
import { GoalFormPage } from "@/routes/goals/GoalFormPage";
import { GoalDetailPage } from "@/routes/goals/GoalDetailPage";
import { ExerciseListPage } from "@/routes/exercises/ExerciseListPage";
import { ExerciseDetailPage } from "@/routes/exercises/ExerciseDetailPage";
import { ExerciseFormPage } from "@/routes/exercises/ExerciseFormPage";

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
        <Route path="/sessions/log-past" element={<RetroactiveSessionPage />} />
        <Route path="/sessions/:id" element={<ActiveSessionPage />} />
        <Route path="/routines" element={<RoutinesListPage />} />
        <Route path="/routines/:id" element={<RoutineDetailPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/progress/:id" element={<ExerciseProgressPage />} />
        <Route path="/body" element={<BodyPage />} />
        <Route path="/body/:metric" element={<MetricDetailPage />} />
        <Route path="/goals" element={<GoalsListPage />} />
        <Route path="/goals/new" element={<GoalFormPage />} />
        <Route path="/goals/:id" element={<GoalDetailPage />} />
        <Route path="/goals/:id/edit" element={<GoalFormPage />} />
        <Route path="/exercises" element={<ExerciseListPage />} />
        <Route path="/exercises/new" element={<ExerciseFormPage />} />
        <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
        <Route path="/exercises/:id/edit" element={<ExerciseFormPage />} />
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
