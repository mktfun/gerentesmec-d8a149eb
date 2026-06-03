import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 m-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 overflow-auto">
          <h2 className="text-lg font-bold mb-2">Erro de Renderização</h2>
          <pre className="text-xs whitespace-pre-wrap">{this.state.error?.message}</pre>
          <pre className="text-xs whitespace-pre-wrap mt-2">{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
