import React from "react";
import { ShieldAlert, RefreshCcw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center select-none relative">
          {/* Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-destructive/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 space-y-6 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20 shadow-lg shadow-destructive/5 animate-pulse">
              <ShieldAlert size={32} />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Runtime Exception
              </h1>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                The application encountered an unexpected state and terminated the routine execution.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-muted/50 border border-border/50 rounded-2xl text-[11px] font-mono text-left text-muted-foreground break-all max-h-40 overflow-y-auto custom-scrollbar">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                onClick={this.handleReset}
                className="btn-primary py-3 px-6 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
              >
                <RefreshCcw size={14} /> Reinitialize
              </button>
              <a
                href="/"
                className="btn-secondary py-3 px-6 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 border border-border/50"
              >
                <Home size={14} /> Escape to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
