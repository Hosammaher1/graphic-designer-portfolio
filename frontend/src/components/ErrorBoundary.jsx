import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[Portfolio ErrorBoundary] Caught error:', error, errorInfo);
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

      return (
        <div
          role="alert"
          className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="max-w-md w-full bg-stone-900/80 border border-stone-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-950/50 border border-red-800/40 flex items-center justify-center text-red-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              Something went wrong / حدث خطأ غير متوقع
            </h1>

            <p className="text-stone-400 text-sm mb-6 leading-relaxed">
              We encountered an unexpected display issue. Please refresh the page to continue.
              <br />
              واجهنا مشكلة غير متوقعة في العرض. يرجى تحديث الصفحة للمتابعة.
            </p>

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold transition-colors duration-200 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              Refresh Page / إعادة تحميل الصفحة
            </button>

            {isDev && this.state.error && (
              <details className="mt-6 text-left text-xs text-red-300/80 bg-black/50 p-3 rounded-lg overflow-auto max-h-48 border border-red-900/30">
                <summary className="cursor-pointer font-mono font-semibold">Development Error Trace</summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</pre>
                {this.state.error.stack && (
                  <pre className="mt-2 text-[10px] text-stone-500 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
