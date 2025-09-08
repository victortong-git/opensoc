import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="card p-6 min-h-32">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <p className="text-sm text-red-400">Component Error</p>
              <p className="text-xs text-slate-500 mt-1">
                {this.props.componentName ? 
                  `${this.props.componentName} failed to load` : 
                  'Something went wrong'
                }
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="mt-3 px-3 py-1 text-xs bg-soc-dark-700 hover:bg-soc-dark-600 text-slate-300 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;