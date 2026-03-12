import { Component, type ReactNode } from "react";
import { Button, Terminal } from "@css-mountain/shared-ui";
import { reportError } from "@/services/error-reporter";

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional fallback component. If not provided, a DOS-styled error screen is shown. */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, info: { componentStack: string | null }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary with DOS-styled error screen.
 * Catches render errors in the subtree and shows a retry option.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportError("render", error, {
      componentStack: info.componentStack ?? "unknown",
    });
    this.props.onError?.(error, {
      componentStack: info.componentStack ?? null,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--dos-space-2)",
            backgroundColor: "var(--dos-bg)",
          }}
          data-testid="error-boundary"
        >
          <Terminal title="SYSTEM ERROR">
            <div style={{ padding: "var(--dos-space-2)" }}>
              <div
                style={{
                  color: "var(--dos-error)",
                  marginBottom: "var(--dos-space-2)",
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                }}
              >
                {`
  *** FATAL ERROR ***

  An unrecoverable error has occurred.

  ${this.state.error?.message ?? "Unknown error"}
                `.trim()}
              </div>
              <div
                style={{
                  color: "var(--dos-fg)",
                  marginBottom: "var(--dos-space-2)",
                }}
              >
                Press RETRY to attempt recovery, or reload the page.
              </div>
              <div style={{ display: "flex", gap: "var(--dos-space-1)" }}>
                <Button variant="primary" onClick={this.handleRetry}>
                  RETRY
                </Button>
                <Button
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  RELOAD
                </Button>
              </div>
            </div>
          </Terminal>
        </div>
      );
    }

    return this.props.children;
  }
}
