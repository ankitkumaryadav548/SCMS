import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-darkbg-pure flex items-center justify-center p-6 text-white font-sans">
          <div className="w-full max-w-md bg-darkbg-card border border-darkbg-border rounded-2xl shadow-glass p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6 text-rose-500">
              <AlertOctagon className="h-8 w-8" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-darkbg-textMuted leading-relaxed mb-6">
              An unexpected error occurred in the dashboard user interface. You can attempt to refresh the application.
            </p>

            {this.state.error && (
              <div className="w-full bg-darkbg-pure border border-darkbg-border rounded-lg p-3 text-left mb-6 overflow-x-auto max-h-36">
                <code className="text-xs text-rose-400 font-mono block whitespace-pre">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-brand-500/20"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Terminal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
