import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs) => twMerge(clsx(inputs));

const Button = React.forwardRef(({ className, variant = "primary", size = "md", ...props }, ref) => {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20",
    secondary: "bg-secondary text-secondary-foreground border border-border/50 hover:bg-secondary/80",
    ghost: "bg-transparent hover:bg-secondary text-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
    outline: "bg-transparent border border-border/50 hover:border-primary/50 text-foreground",
  };

  const sizes = {
    sm: "px-4 py-2 text-[9px]",
    md: "px-6 py-3 text-[10px]",
    lg: "px-8 py-4 text-[11px]",
    icon: "p-2.5",
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };
