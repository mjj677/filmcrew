import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import CrewDirectory from "@/pages/CrewDirectory";
import CrewProfile from "@/pages/CrewProfile";
import Jobs from "@/pages/Jobs";
import PostJob from "@/pages/PostJob";
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import Inbox from "@/pages/Inbox";
import Profile from "@/pages/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/crew" element={<CrewDirectory />} />
      <Route path="/crew/:username" element={<CrewProfile />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/post" element={<PostJob />} />
      <Route path="/jobs/:id" element={<div>Job detail</div>} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;