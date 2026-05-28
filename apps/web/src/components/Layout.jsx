import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { PageTransition } from "./PageTransition";
import { AnimatePresence } from "framer-motion";

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-300">
      <Navbar />
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname} className="w-full h-full">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <footer className="py-8 text-center text-sm font-medium text-muted-foreground border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Dev Collaboration Platform. Engineered with precision.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
