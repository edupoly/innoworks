import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import AuthCallback from "./pages/AuthCallback";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Leaderboard from "./pages/Leaderboard";
import ProjectDetails from "./pages/ProjectDetails";
import CreateProject from "./pages/CreateProject";
import { setCredentials, setLoading } from "./store/slices/authSlice";
import api from "./lib/api.js";
import { Github, Rocket, Search, ShieldCheck, Zap } from "lucide-react";

const Home = () => {
  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "https://innoworks.onrender.com";
    window.location.href = `${apiUrl}/auth/github`;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 lg:py-32 flex flex-col items-center text-center px-4 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap size={14} className="fill-primary" />
          <span>The Next Generation of Dev Collaboration</span>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-black mb-8 tracking-tighter max-w-4xl leading-[1.1]">
          Build the Future of <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-indigo-600">
            Open Source Together
          </span>
        </h1>
        
        <p className="text-muted-foreground text-xl lg:text-2xl max-w-2xl mb-12 leading-relaxed font-medium">
          A professional ecosystem for engineers to showcase talent, solve complex challenges, and earn bounties from top-tier projects.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5">
          <button
            onClick={handleLogin}
            className="btn-primary flex items-center justify-center gap-2 px-10 py-4 text-lg shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all"
          >
            <Github size={20} />
            Connect with GitHub
          </button>
          <Link
            to="/projects"
            className="btn-secondary flex items-center justify-center gap-2 px-10 py-4 text-lg hover:-translate-y-1 transition-all"
          >
            <Search size={20} />
            Explore Projects
          </Link>
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 font-bold text-xl"><Github size={24} /> GitHub</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Zap size={24} /> Fast Company</div>
          <div className="flex items-center gap-2 font-bold text-xl"><ShieldCheck size={24} /> Verified</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-32 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4">Everything you need to ship.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Our platform provides the infrastructure so you can focus on writing world-class code.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <Rocket size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Fast-Track Growth</h3>
              <p className="text-muted-foreground leading-relaxed">Accelerate your career by contributing to production-ready projects and earning verified XP that companies trust.</p>
            </div>
            
            <div className="flex flex-col p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-colors group text-primary-foreground bg-gradient-to-br from-primary to-blue-700">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Automated Validation</h3>
              <p className="text-white/80 leading-relaxed">Our automated testing engine ensures your code meets the highest standards before it even reaches a human reviewer.</p>
            </div>
            
            <div className="flex flex-col p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Earn Bounties</h3>
              <p className="text-muted-foreground leading-relaxed">Get rewarded for your contributions with transparent bounty systems, instant XP gains, and platform recognition.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

function App() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isAuthenticated) {
      const fetchUser = async () => {
        dispatch(setLoading(true));
        try {
          const response = await api.get("/auth/me");
          dispatch(setCredentials({ user: response.data, token }));
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        } finally {
          dispatch(setLoading(false));
        }
      };
      fetchUser();
    }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black tracking-tight mb-2">Restoring Your Session</h2>
        <p className="text-muted-foreground text-sm font-medium">Please wait while we sync with the server...</p>
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
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route
            path="/projects/new"
            element={isAuthenticated ? <CreateProject /> : <Navigate to="/" />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
          />
        </Route>
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </Router>
  );
}

export default App;