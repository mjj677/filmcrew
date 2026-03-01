import { Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Home from "@/pages/Home";
import CrewDirectory from "@/pages/CrewDirectory";
import CrewProfile from "@/pages/CrewProfile";
import Jobs from "@/pages/Jobs";
import PostJob from "@/pages/PostJob";
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import Inbox from "@/pages/Inbox";
import Profile from "@/pages/Profile";
import Connections from "@/pages/Connections"
import CreateCompany from "@/pages/CreateCompany";
import CompanyDashboard from "@/pages/CompanyDashboard";
import CreateProduction from "@/pages/CreateProduction";
import ProductionDetail from "@/pages/ProductionDetail";
import CompanySettings from "@/pages/CompanySettings";

function App() {

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route element={<RootLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/crew" element={<CrewDirectory />} />
        <Route path="/crew/:username" element={<CrewProfile />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/post" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<div>Job detail</div>} />
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/inbox/:conversationId" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
        <Route path="/companies/new" element={<ProtectedRoute><CreateCompany /></ProtectedRoute>} />
        <Route path="/companies/:slug/dashboard" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/companies/:slug/productions/new" element={<ProtectedRoute><CreateProduction /></ProtectedRoute>} />
        <Route path="/companies/:slug/settings" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
        <Route path="/productions/:slug" element={<ProductionDetail />} />
      </Route>
    </Routes>
  );
}

export default App;