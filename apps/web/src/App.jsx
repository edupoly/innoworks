import { useEffect, lazy, Suspense } from "react";
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

// Lazy Load Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Projects = lazy(() => import("./pages/Projects"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const CreateProject = lazy(() => import("./pages/CreateProject"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

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
            <Link
              to="/dashboard"
              className="group btn-primary w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 text-sm font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 flex items-center gap-4 transition-all hover:scale-105 hover:-translate-y-1"
            >
              <LayoutDashboard size={20} />
              Command Center
            </Link>
          ) : (
            <button
              onClick={handleLogin}
              className="group btn-primary w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 text-sm font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 flex items-center gap-4 transition-all hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform"></div>
              <Github size={20} className="group-hover:rotate-12 transition-transform duration-500" />
              Login with GitHub
            </button>
          )}

          <Link
            to="/projects"
            className="group btn-secondary w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 text-sm font-black uppercase tracking-widest rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-3xl hover:bg-secondary/80 hover:-translate-y-1 transition-all flex items-center gap-4"
          >
            <Search size={20} className="group-hover:scale-110 transition-transform duration-500 text-primary" />
            Explore Missions
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
              { step: "01", title: "Select Mission", desc: "Choose from production-grade challenges curated by elite engineers." },
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
                Compete with the top 1% of student engineers worldwide. Rise through the ranks and unlock exclusive missions.
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
              { label: "Missions Active", value: "850+" },
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
            <button
              onClick={handleLogin}
              className="px-20 py-8 bg-primary text-primary-foreground rounded-[2.5rem] text-sm font-black uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-[0_30px_60px_rgba(99,102,241,0.4)] border border-white/10"
            >
              Initialize Node
            </button>
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

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Consistently handle session restoration and user data sync via React Query
  useMe();

  useEffect(() => {
    console.log("App: Component mounted, isAuthenticated:", isAuthenticated);
  }, [isAuthenticated]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </Router>
  );
}

export default App;
