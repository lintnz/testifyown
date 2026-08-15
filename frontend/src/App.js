import React, { useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Onboarding from "@/pages/Onboarding";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import Overview from "@/pages/dashboard/Overview";
import Testimonials from "@/pages/dashboard/Testimonials";
import TestimonialDetail from "@/pages/dashboard/TestimonialDetail";
import Collections from "@/pages/dashboard/Collections";
import CollectionEditor from "@/pages/dashboard/CollectionEditor";
import Widgets from "@/pages/dashboard/Widgets";
import WidgetBuilder from "@/pages/dashboard/WidgetBuilder";
import Analytics from "@/pages/dashboard/Analytics";
import Settings from "@/pages/dashboard/Settings";
import PublicCollection from "@/pages/PublicCollection";
import WidgetEmbed from "@/pages/WidgetEmbed";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function AuthCallback() {
  const navigate = useNavigate();
  const { googleAuth } = useAuth();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    (async () => {
      try {
        const user = await googleAuth(decodeURIComponent(match[1]));
        window.history.replaceState(null, "", window.location.pathname);
        navigate(user.onboarded ? "/dashboard" : "/onboarding", { replace: true });
      } catch (e) {
        navigate("/login", { replace: true });
      }
    })();
  }, []); // eslint-disable-line
  return <LoadingScreen />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === null) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === null) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Overview />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="testimonials/:id" element={<TestimonialDetail />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/:id" element={<CollectionEditor />} />
        <Route path="widgets" element={<Widgets />} />
        <Route path="widgets/:id" element={<WidgetBuilder />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/t/:slug" element={<PublicCollection />} />
      <Route path="/embed/:id" element={<WidgetEmbed />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster theme="dark" position="top-right" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
