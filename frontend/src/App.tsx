// Rotrouter: landning, auth och dashboard-vyer under `/dashboard`.
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardHomePage } from "./pages/dashboard/DashboardHomePage";
import { LifestylePage } from "./pages/dashboard/LifestylePage";
import { NutritionPage } from "./pages/dashboard/NutritionPage";
import { TrainingPage } from "./pages/dashboard/TrainingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHomePage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="nutrition" element={<NutritionPage />} />
        <Route path="lifestyle" element={<LifestylePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
