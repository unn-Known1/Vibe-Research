import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { withTranslation } from "react-i18next";

interface Props { children: ReactNode; fallback?: ReactNode; t: (key: string) => string; }
interface State { hasError: boolean; error?: Error; }

class ErrorBoundaryComponent extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="m-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{this.state.error?.message || this.props.t("components.errorBoundary.fallback")}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryComponent);
