import { Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Home from "@/pages/Home";
import CrewDirectory from "@/pages/CrewDirectory";
import CrewProfile from "@/pages/CrewProfile";
import Jobs from "@/pages/Jobs";
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import Inbox from "@/pages/Inbox";
import Profile from "@/pages/Profile";
import Connections from "@/pages/Connections";
import MyApplications from "@/pages/MyApplications";
import CreateCompany from "@/pages/CreateCompany";
import CompanyDashboard from "@/pages/CompanyDashboard";
import CreateProduction from "@/pages/CreateProduction";
import ProductionDetail from "@/pages/ProductionDetail";
import EditProduction from "@/pages/EditProduction";
import CreateJob from "@/pages/CreateJob";
import JobDetail from "@/pages/JobDetail";
import EditJob from "@/pages/EditJob";
import CompanySettings from "@/pages/CompanySettings";
import Companies from "@/pages/Companies";
import CompanyProfile from "@/pages/CompanyProfile";

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
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/jobs/:id/edit" element={<ProtectedRoute><EditJob /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/inbox/:conversationId" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:slug" element={<CompanyProfile />} />
        <Route path="/companies/new" element={<ProtectedRoute><CreateCompany /></ProtectedRoute>} />
        <Route path="/companies/:slug/dashboard" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/companies/:slug/productions/new" element={<ProtectedRoute><CreateProduction /></ProtectedRoute>} />
        <Route path="/companies/:slug/settings" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
        <Route path="/productions/:slug" element={<ProductionDetail />} />
        <Route path="/productions/:slug/edit" element={<ProtectedRoute><EditProduction /></ProtectedRoute>} />
        <Route path="/productions/:slug/jobs/new" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;