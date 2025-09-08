import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class AnalysisErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 OneClickAnalysis Error Boundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleClose = () => {
    this.handleReset();
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-soc-dark-800 border border-red-500/20 rounded-lg w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-full">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Analysis Error</h2>
                  <p className="text-sm text-slate-400">One Click Analysis encountered an error</p>
                </div>
              </div>
              <button
                onClick={this.handleClose}
                className="p-2 hover:bg-soc-dark-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-300 font-medium">Component Error</p>
                    <p className="text-xs text-red-400 mt-1">
                      The One Click Analysis component has encountered an error and needs to be reset.
                    </p>
                  </div>
                </div>
              </div>

              {this.state.error && (
                <div className="bg-soc-dark-900/50 border border-soc-dark-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="text-sm text-slate-300 space-y-2">
                <p>This error has been logged for debugging. You can:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
                  <li>Click "Reset" to try loading the component again</li>
                  <li>Close this modal and try again later</li>
                  <li>Use individual AI analysis buttons as an alternative</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-soc-dark-700">
                <button
                  onClick={this.handleClose}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset Component</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AnalysisErrorBoundary;