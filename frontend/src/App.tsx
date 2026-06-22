import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { isAuthenticated } from "./api/auth";
import Header from "./components/Header";
import { useAuth } from "./hooks/useAuth";
import { C } from "./lib/theme";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuthCallback from "./pages/AuthCallback";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

function ProtectedApp() {
  const { user, loading } = useAuth();
  const [syncStatus, setSyncStatus] = useState<"idle" | "running">("idle");

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.muted,
          fontSize: "14px",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <Header user={user} syncStatus={syncStatus} />
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        <Routes>
          <Route index element={<DashboardPage onSyncStatusChange={setSyncStatus} />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={isAuthenticated() ? <Navigate to="/app" replace /> : <LoginPage />}
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/app/*" element={<ProtectedApp />} />
    </Routes>
  );
}
