"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  retries: number;
}

const MAX_RETRIES = 2;

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retries: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Only log once per boundary instance
    console.error(`[ErrorBoundary:${this.props.name || "unknown"}]`, error.message);
  }

  handleRetry = () => {
    if (this.state.retries < MAX_RETRIES) {
      this.setState(s => ({ hasError: false, error: undefined, retries: s.retries + 1 }));
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const canRetry = this.state.retries < MAX_RETRIES;

      return (
        <div className="glass p-4 flex items-center justify-center min-h-[80px] border-white/5">
          <div className="text-center space-y-2">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
              {canRetry ? "Erro ao carregar componente" : "Componente indisponível"}
            </p>
            {canRetry ? (
              <button
                onClick={this.handleRetry}
                className="text-[10px] font-bold text-accent hover:underline"
              >
                Tentar novamente
              </button>
            ) : (
              <p className="text-[10px] text-muted/50">Recarregue a página para tentar novamente.</p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
