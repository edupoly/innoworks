import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import AuthCallback from "./pages/AuthCallback";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import Leaderboard from "./pages/Leaderboard";
import ProjectDetails from "./pages/ProjectDetails";
import CreateProject from "./pages/CreateProject";
import { setCredentials, setLoading } from "./store/slices/authSlice";
import api from "./lib/api.js";
import { Github, Rocket, Search, ShieldCheck, Zap } from "lucide-react";

// Protected Route Component to prevent unauthorized access and handle loading
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const token = localStorage.getItem("token");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black tracking-tight mb-2">Restoring Your Session</h2>
        <p className="text-muted-foreground text-sm font-medium">Please wait while we sync with the server...</p>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, go to dashboard
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "https://innoworks.onrender.com";
    window.location.href = `${apiUrl}/auth/github`;
  };

  return (
    <div className="flex flex-col items-center bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-10 backdrop-blur-sm"
        >
          <Sparkles size={14} className="fill-primary" />
          <span>The Next Generation of Dev Collaboration</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl lg:text-8xl font-black mb-8 tracking-tight max-w-5xl leading-[0.9] text-foreground"
        >
          Build the Future of <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-blue-600">
            Open Source
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-lg lg:text-xl max-w-2xl mb-12 leading-relaxed font-medium"
        >
          Innoworks is the premier ecosystem for elite engineers to solve complex challenges, contribute to world-class projects, and earn verified recognition.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-5"
        >
          <button
            onClick={handleLogin}
            className="btn-primary flex items-center justify-center gap-3 px-10 py-5 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all rounded-2xl"
          >
            <Github size={20} />
            Connect GitHub
          </button>
          <Link
            to="/projects"
            className="btn-secondary flex items-center justify-center gap-3 px-10 py-5 text-base font-black uppercase tracking-widest hover:-translate-y-1 transition-all rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl"
          >
            <Search size={20} />
            Explore Missions
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-24 flex flex-wrap justify-center gap-10 grayscale"
        >
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter"><Github size={20} /> GitHub Ecosystem</div>
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter"><ShieldCheck size={20} /> Enterprise Verified</div>
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tighter"><Zap size={20} /> Real-time Sync</div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-32 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-10 rounded-[40px] bg-card border border-border/50 hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-primary/5">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Rocket size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Rapid Engineering</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">Contribute to mission-critical repositories with a streamlined workflow designed for high-velocity developers.</p>
            </div>
            
            <div className="group p-10 rounded-[40px] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="w-16 h-16 rounded-3xl bg-white/20 text-white flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Verified Proof</h3>
              <p className="text-primary-foreground/80 leading-relaxed font-medium">Every contribution is automatically validated and peer-reviewed, earning you immutable XP and reputation points.</p>
            </div>
            
            <div className="group p-10 rounded-[40px] bg-card border border-border/50 hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-primary/5">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Reward Engine</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">Earn tiered rewards and unlock exclusive badges as you scale the global leaderboard and dominate the ecosystem.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

import { useMe } from "./hooks/useAuth";

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Consistently handle session restoration and user data sync via React Query
  useMe();

  useEffect(() => {
    console.log("App: Component mounted, isAuthenticated:", isAuthenticated);
  }, [isAuthenticated]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <CreateProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route path="/profile/:username" element={<Profile />} />
        </Route>

        {/* Auth Callback variants */}
        <Route path="/auth/callback/*" element={<AuthCallback />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="//auth/callback/*" element={<AuthCallback />} />
        <Route path="//auth/callback" element={<AuthCallback />} />
        <Route path="/auth/*" element={<AuthCallback />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;