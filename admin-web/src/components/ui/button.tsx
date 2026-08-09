import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient" | "glass";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
    
    const variants = {
      default: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25",
      destructive: "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 shadow-lg shadow-rose-500/10",
      outline: "border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 backdrop-blur-md",
      secondary: "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/25",
      ghost: "hover:bg-white/5 text-slate-300 hover:text-white",
      link: "text-primary underline-offset-4 hover:underline",
      gradient: "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:opacity-95 hover:shadow-pink-500/40",
      glass: "bg-slate-800/60 backdrop-blur-xl border border-white/10 text-white hover:bg-slate-700/60 hover:border-white/20 shadow-glass"
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-8 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
