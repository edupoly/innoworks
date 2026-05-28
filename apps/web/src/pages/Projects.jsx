import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";
import { Link } from "react-router-dom";
import { BadgeDollarSign, Layers, Users, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Projects = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get("/projects");
      return response.data;
    },
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-muted-foreground font-medium mt-6 animate-pulse">Discovering opportunities...</p>
    </div>
  );

  return (
    <div className="py-12 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Active Challenges</h1>
          <p className="text-muted-foreground text-lg">Accept a mission and start building your reputation.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-card border border-border/50 rounded-xl shadow-sm flex items-center gap-2 text-sm font-medium">
            <Users size={16} className="text-primary" />
            <span>{projects?.length || 0} Projects</span>
          </div>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {projects?.map((project) => (
          <motion.div variants={item} key={project._id || project.id}>
            <div className="bg-card rounded-2xl p-6 card-hover flex flex-col h-full group relative overflow-hidden">
              {/* Subtle gradient glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <span
                  className={`text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full shadow-sm ${
                    project.difficulty === "Easy"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : project.difficulty === "Medium"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {project.difficulty}
                </span>
                <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full shadow-sm">
                  <BadgeDollarSign size={16} />
                  <span>{project.bounty || 0}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors relative z-10">{project.title}</h3>
              <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed flex-grow relative z-10">
                {project.description}
              </p>

              <div className="pt-6 border-t border-border/50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <Layers size={16} className="text-primary/70" />
                  <span>{project.requiredSkills?.length || 0} Skills</span>
                </div>
                <Link
                  to={`/projects/${project._id || project.id}`}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                >
                  Solve Mission
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {(!projects || projects.length === 0) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border"
        >
          <Star size={48} className="mx-auto text-muted mb-4 opacity-30" />
          <h2 className="text-xl font-bold mb-2">No missions available yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">The community is currently preparing new challenges. Check back soon for new opportunities!</p>
        </motion.div>
      )}
    </div>
  );
};

export default Projects;
