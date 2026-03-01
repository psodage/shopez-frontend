import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production, send this to a logging service
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 dark:bg-slate-950 dark:text-slate-50">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
            <h1 className="text-lg font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              An unexpected error occurred. Please refresh the page or try
              again in a moment.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

