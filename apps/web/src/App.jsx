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
import { Github, Rocket, Search, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "https://innoworks-api.up.railway.app";
    window.location.href = `${apiUrl}/auth/github`;
  };

  return (
    <div className="flex flex-col items-center bg-background overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            x: [0, -30, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* Hero Section */}
      <section className="w-full min-h-screen flex flex-col items-center justify-center text-center px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0, 0.71, 0.2, 1.01] }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150"></div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative px-6 py-2 rounded-full bg-background/50 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em] backdrop-blur-xl shadow-2xl flex items-center gap-3"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <Sparkles size={14} className="fill-primary" />
            <span>The Era of Elite Engineering</span>
          </motion.div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-7xl md:text-9xl font-black mb-10 tracking-tighter max-w-6xl leading-[0.85] text-foreground"
        >
          Forge Your <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary via-indigo-500 to-blue-600 drop-shadow-2xl">
            Digital Legacy
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-muted-foreground text-lg md:text-2xl max-w-3xl mb-16 leading-relaxed font-medium tracking-tight"
        >
          Innoworks is the premier orbital station for high-velocity developers. Solve mission-critical challenges, earn verified XP, and dominate the global leaderboard.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6"
        >
          <button
            onClick={handleLogin}
            className="group relative btn-primary flex items-center justify-center gap-4 px-12 py-6 text-lg font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(99,102,241,0.3)] hover:shadow-primary/40 hover:-translate-y-1 transition-all rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            <Github size={24} className="group-hover:rotate-12 transition-transform" />
            Connect GitHub
          </button>
          <Link
            to="/projects"
            className="group btn-secondary flex items-center justify-center gap-4 px-12 py-6 text-lg font-black uppercase tracking-widest hover:-translate-y-1 transition-all rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl"
          >
            <Search size={24} className="group-hover:scale-110 transition-transform" />
            Explore Missions
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2, delay: 1 }}
          className="mt-32 flex flex-wrap justify-center gap-16"
        >
          <div className="flex items-center gap-3 font-black text-sm uppercase tracking-[0.3em]"><Github size={20} /> GitHub Ecosystem</div>
          <div className="flex items-center gap-3 font-black text-sm uppercase tracking-[0.3em]"><ShieldCheck size={20} /> Zero Trust Security</div>
          <div className="flex items-center gap-3 font-black text-sm uppercase tracking-[0.3em]"><Zap size={20} /> Real-time Sync</div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20"
        >
          <div className="w-1 h-12 bg-gradient-to-b from-primary to-transparent rounded-full"></div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-40 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                icon: Rocket, 
                title: "Orbital Velocity", 
                desc: "Streamlined PR workflows and automated environment provisioning for high-impact contributors.",
                color: "blue"
              },
              { 
                icon: ShieldCheck, 
                title: "Immutable Proof", 
                desc: "Every contribution is cryptographiclly linked to your profile, earning you unforgeable reputation points.",
                color: "indigo",
                featured: true
              },
              { 
                icon: Zap, 
                title: "Quantum Sync", 
                desc: "Real-time synchronization with GitHub hooks ensures your metrics are always up-to-the-millisecond.",
                color: "violet"
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className={`group p-12 rounded-[3rem] border transition-all duration-500 shadow-2xl ${
                  f.featured 
                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20" 
                    : "bg-card/50 backdrop-blur-3xl border-white/5 hover:border-primary/20 shadow-black/20"
                }`}
              >
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                  f.featured ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                }`}>
                  <f.icon size={40} />
                </div>
                <h3 className="text-3xl font-black mb-6 tracking-tight">{f.title}</h3>
                <p className={`text-lg leading-relaxed font-medium ${f.featured ? "text-white/80" : "text-muted-foreground"}`}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="w-full py-32 border-y border-white/5 bg-white/[0.02] backdrop-blur-3xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "XP Distributed", value: "2.4M+" },
            { label: "Missions Completed", value: "12.8K" },
            { label: "Active Nodes", value: "4.2K" },
            { label: "Global Ranking", value: "#1" }
          ].map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-4xl md:text-6xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                {s.value}
              </p>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-primary/60">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-60 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto p-20 rounded-[4rem] bg-gradient-to-br from-primary to-indigo-700 text-center relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(99,102,241,0.5)]"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">Ready to Deploy?</h2>
            <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto font-medium">
              Join the elite ranks of student engineers building the next generation of software infrastructure.
            </p>
            <button
              onClick={handleLogin}
              className="px-16 py-6 bg-white text-primary rounded-[2rem] text-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              Initialize Sync
            </button>
          </div>
        </motion.div>
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