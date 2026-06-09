import { useState } from "react";
import { 
  Rocket, 
  LogIn, 
  GitBranch, 
  Book, 
  Box, 
  Terminal, 
  Play, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";

const steps = [
  {
    title: "Identity Synced",
    description: "Your professional engineer profile is now active on the Innoworks grid.",
    icon: LogIn,
    detail: "Authenticate via GitHub to link your repositories and track your technical reputation."
  },
  {
    title: "Join Project",
    description: "Discover high-impact challenges and fork the codebase to your own terminal.",
    icon: GitBranch,
    detail: "Browse the Marketplace, select a mission, and initiate an automated repository fork."
  },
  {
    title: "Read Wiki",
    description: "Access project archives to understand the environment setup protocol.",
    icon: Book,
    detail: "Every mission has a dedicated Wiki containing setup guides, standards, and architecture maps."
  },
  {
    title: "Docker Pulse",
    description: "Download approved containers to replicate the project environment instantly.",
    icon: Box,
    detail: "Use approved Dockerfiles and Compose configs to ensure consistency across all developer nodes."
  },
  {
    title: "Configure .env",
    description: "Set your local variables to establish a secure link with the project services.",
    icon: Terminal,
    detail: "Copy environment templates from the documentation and configure your local secret store."
  },
  {
    title: "Execution",
    description: "Boot the project and begin your technical transmission.",
    icon: Play,
    detail: "Run the install and start commands to verify your environment is stable and ready for contribution."
  }
];

const SetupWizard = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-10"
      >
        {/* Sidebar Status */}
        <div className="md:col-span-3 bg-muted/30 border-r border-border/30 p-8 hidden md:block">
           <div className="flex items-center gap-3 mb-10">
             <Rocket className="text-primary" size={20} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Onboarding_Sequence</span>
           </div>
           
           <div className="space-y-3">
             {steps.map((s, i) => (
               <div key={i} className="flex items-center gap-3">
                 <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                   i === currentStep 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                    : i < currentStep 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border/50"
                 }`}>
                   {i < currentStep ? <CheckCircle2 size={14} /> : <span className="text-[9px] font-black">{i + 1}</span>}
                 </div>
                 <span className={`text-[9px] font-black uppercase tracking-widest ${i === currentStep ? "text-foreground" : "text-muted-foreground opacity-50"}`}>
                   {s.title}
                 </span>
               </div>
             ))}
           </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-between min-h-[450px]">
           <div>
             <AnimatePresence mode="wait">
               <motion.div
                 key={currentStep}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-6"
               >
                 <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <activeStep.icon size={24} />
                 </div>
                 
                 <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">{activeStep.title}</h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">{activeStep.description}</p>
                 </div>

                 <div className="p-6 bg-muted/20 border border-border/50 rounded-xl space-y-3">
                    <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                       <Terminal size={12} className="text-primary" /> Technical Intelligence
                    </p>
                    <p className="text-xs font-medium leading-relaxed opacity-80">{activeStep.detail}</p>
                 </div>
               </motion.div>
             </AnimatePresence>
           </div>

           <div className="flex items-center justify-between mt-10 pt-8 border-t border-border/30">
              <Button 
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={currentStep === 0}
                className="gap-2 disabled:opacity-0 text-[10px] uppercase tracking-widest"
              >
                <ChevronLeft size={14} /> Previous
              </Button>
              
              <Button 
                size="sm"
                onClick={next}
                className="px-8 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                {currentStep === steps.length - 1 ? "Begin Transmission" : "Next Step"} 
                {currentStep < steps.length - 1 && <ChevronRight size={14} />}
              </Button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupWizard;
