"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[STEAL] Unhandled render error:", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">STEAL</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-xs text-sm text-white/50">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            className="mt-6 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white active:opacity-70"
            onClick={this.handleReload}
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight section-level boundary — shows a subtle inline error
 * instead of taking down the whole screen.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[STEAL] Section render error:", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white/40">
          This section couldn&apos;t load. Reload the app if the issue continues.
        </div>
      );
    }

    return this.props.children;
  }
}
