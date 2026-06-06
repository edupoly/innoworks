import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs) => twMerge(clsx(inputs));

const Badge = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-border/50",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    outline: "text-foreground border-border/50",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export { Badge };
