import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { Github, Rocket, Search, ShieldCheck, Zap, Sparkles, LayoutDashboard, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import Leaderboard from "./pages/Leaderboard";
import ProjectDetails from "./pages/ProjectDetails";
import CreateProject from "./pages/CreateProject";
import AuthCallback from "./pages/AuthCallback";
import AdminDashboard from "./pages/admin/AdminDashboard";
import WikiHome from "./pages/wiki/WikiHome";
import WikiPage from "./pages/wiki/WikiPage";
import EditWiki from "./pages/wiki/EditWiki";

// High-fidelity loading fallback for Suspense
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
      Loading Module...
    </p>
  </div>
);

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

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const token = localStorage.getItem("token");

  if (loading) return <PageLoader />;

  if (!isAuthenticated || !token || user?.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "https://innoworks-api.up.railway.app";
    window.location.href = `${apiUrl}/auth/github`;
  };

  return (
    <div className="flex flex-col bg-transparent selection:bg-primary/20 scroll-smooth">
      {/* Hero Section */}
      <section className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center pt-20 pb-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-10 inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-secondary/80 border border-border/50 text-primary text-[10px] font-black uppercase tracking-[0.25em] backdrop-blur-2xl shadow-xl shadow-black/5"
        >
          <Sparkles size={14} className="fill-primary" />
          The Standard for Student Engineering
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-[8rem] font-black mb-10 tracking-tight md:tracking-tighter leading-[0.95] text-foreground max-w-[90rem]"
        >
          Architect Your <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-blue-500">
            Engineering Future
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-16 font-medium leading-relaxed tracking-tight"
        >
          The elite ecosystem for high-velocity developers. Solve production-grade challenges, earn verified XP, and build a reputation that speaks for itself.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full max-w-xl flex-col sm:flex-row gap-4 sm:gap-6"
        >
          {isAuthenticated ? (
            <Link to="/dashboard" className="flex-1">
              <Button className="w-full py-6 text-sm gap-4">
                <LayoutDashboard size={20} />
                Command Center
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleLogin}
              className="flex-1 py-6 text-sm gap-4 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform"></div>
              <Github size={20} className="group-hover:rotate-12 transition-transform duration-500" />
              Login with GitHub
            </Button>
          )}

          <Link to="/projects" className="flex-1">
            <Button
              variant="secondary"
              className="w-full py-6 text-sm gap-4 backdrop-blur-3xl"
            >
              <Search size={20} className="group-hover:scale-110 transition-transform duration-500 text-primary" />
              Explore Projects
            </Button>
          </Link>
        </motion.div>

        {/* Ecosystem Logos (Ultra Subtle) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 3, delay: 1 }}
          className="mt-40 flex flex-wrap justify-center gap-20 text-muted-foreground grayscale hover:grayscale-0 transition-all duration-1000"
        >
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]"><Github size={18} /> GitHub Verified</div>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]"><ShieldCheck size={18} /> Zero-Trust Security</div>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]"><Zap size={18} /> Real-Time Sync</div>
        </motion.div>
      </section>

      {/* Professional "How it Works" section */}
      <section className="relative z-10 w-full py-32 px-6 bg-secondary/20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-12">The_Protocol</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { step: "01", title: "Select Project", desc: "Choose from production-grade challenges curated by elite engineers." },
              { step: "02", title: "Fork & Execute", desc: "Build your solution in your own environment with full Git integration." },
              { step: "03", title: "Peer Review", desc: "Submit for automated testing and expert peer verification." },
              { step: "04", title: "Earn XP", desc: "Acquire verified reputation and climb the global engineering leaderboard." }
            ].map((p, i) => (
              <div key={i} className="space-y-4">
                <div className="text-4xl font-black text-primary/20 tracking-tighter">{p.step}</div>
                <h4 className="text-lg font-black tracking-tight">{p.title}</h4>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento-style Features Section */}
      <section className="relative z-10 w-full py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-8 h-[auto] md:h-[700px]">
            {/* Feature 1: Large */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-2 row-span-1 bg-card border border-border/50 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors"></div>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500">
                <Rocket size={32} />
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tight">Production-Grade Challenges</h3>
              <p className="text-muted-foreground text-lg max-w-lg font-medium leading-relaxed">
                Solve real-world engineering hurdles across diverse stacks. Our engine synchronizes with GitHub to provide instant validation.
              </p>
            </motion.div>

            {/* Feature 2: Small (Vertical) */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-1 row-span-2 bg-primary p-12 rounded-[3rem] shadow-2xl shadow-primary/20 text-primary-foreground flex flex-col justify-end relative overflow-hidden group transition-all duration-500"
            >
              <div className="absolute top-12 right-12 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
                <Zap size={150} />
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tight">Verified Engineering Reputation</h3>
              <p className="text-primary-foreground/90 text-lg font-medium leading-relaxed">
                Every line of code is measured. Accumulate verified XP that translates directly into professional engineering credibility.
              </p>
            </motion.div>

            {/* Feature 3: Small */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-1 row-span-1 bg-secondary/50 backdrop-blur-2xl p-12 rounded-[3rem] border border-border/50 shadow-2xl group flex flex-col justify-center transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Zero-Trust Verification</h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                Automated test suites and expert reviews ensure only the highest quality solutions are merged into our core repositories.
              </p>
            </motion.div>

            {/* Feature 4: Small */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-1 row-span-1 bg-card border border-border/50 rounded-[3rem] p-12 shadow-2xl group flex flex-col justify-center transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Sparkles size={28} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Global Leaderboards</h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                Compete with the top 1% of student engineers worldwide. Rise through the ranks and unlock exclusive projects.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Stats Section */}
      <section className="relative z-10 w-full py-40 border-y border-border/50 bg-secondary/20 backdrop-blur-3xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 text-center">
            {[
              { label: "XP Distributed", value: "2.8M+" },
              { label: "Projects Active", value: "850+" },
              { label: "Peer Reviews", value: "15.2K" },
              { label: "Top Percentile", value: "0.01%" }
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              >
                <p className="text-6xl font-black mb-3 tracking-tighter text-foreground">
                  {s.value}
                </p>
                <div className="w-10 h-1 bg-primary/20 mx-auto mb-4 rounded-full"></div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/70">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative z-10 w-full py-64 px-6">
        <div className="max-w-6xl mx-auto rounded-[5rem] bg-foreground p-24 text-center relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent"></div>
          <div className="absolute top-0 right-0 w-[50%] h-full bg-primary/5 blur-[120px] rounded-full translate-x-1/2 scale-150"></div>
          <div className="relative z-10">
            <h2 className="text-6xl md:text-[8rem] font-black text-background mb-10 tracking-tighter leading-[0.85]">Ready to <br />Deploy?</h2>
            <p className="text-background/60 text-2xl mb-16 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
              Join the elite ranks of student engineers building the next generation of software infrastructure. Your mission begins now.
            </p>
            <Button
              onClick={handleLogin}
              className="px-20 py-8 bg-primary text-primary-foreground rounded-[2.5rem] text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_30px_60px_rgba(99,102,241,0.4)] border border-white/10"
            >
              Initialize Node
            </Button>
          </div>
        </div>
      </section>

      {/* Footer (Elite Minimalism) */}
      <footer className="relative z-10 py-20 border-t border-border/50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-black text-white text-sm shadow-xl shadow-primary/20">IW</div>
             <span className="font-black tracking-tighter text-3xl">Innoworks</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              © 2026 Innoworks Orbital. All rights reserved.
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/40">
              Forged in the silicon fires for the engineering elite.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

import { useMe } from "./hooks/useAuth";
import { useAutoRecovery } from "./hooks/useAutoRecovery";
import { Button } from "./components/ui/Button";

function App() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  // Consistently handle session restoration and user data sync via React Query
  useMe();

  // Trigger auto recovery tracking (Visibility, Focus, Sleep Wake, Reconnect, Inactivity)
  useAutoRecovery();

  useEffect(() => {
    console.log("App: Component mounted, isAuthenticated:", isAuthenticated, "loading:", loading);
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4 select-none relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="relative z-10 space-y-10">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/5 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                 <Rocket size={24} className="animate-float" />
               </div>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-black tracking-tight text-foreground uppercase tracking-[0.4em] text-[11px]">Initializing Node</h2>
            <div className="flex items-center justify-center gap-2">
               <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
               <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.2em]">Decrypting secure telemetry stream...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          
          <Route path="/projects" element={<Projects />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          
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
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/projects/:projectId/wiki" element={<WikiHome />} />
          <Route path="/projects/:projectId/wiki/new" element={<ProtectedRoute><EditWiki /></ProtectedRoute>} />
          <Route path="/projects/:projectId/wiki/:slug" element={<WikiPage />} />
          <Route path="/projects/:projectId/wiki/:slug/edit" element={<ProtectedRoute><EditWiki /></ProtectedRoute>} />
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
