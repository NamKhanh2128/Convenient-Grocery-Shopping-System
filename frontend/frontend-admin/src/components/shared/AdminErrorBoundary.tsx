import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by AdminErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="grid place-items-center py-20 px-4 text-center rounded-[20px] bg-card border border-border/50 shadow-card max-w-xl mx-auto my-12 animate-in fade-in duration-200">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-600 mb-4 animate-bounce">
            <AlertCircle className="h-10 w-10 shrink-0" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight sm:text-2xl">
            Đã xảy ra lỗi không mong muốn
          </h2>
          <p className="mt-2 text-xs font-semibold text-muted-foreground max-w-md leading-relaxed">
            Hệ thống quản trị gặp sự cố khi xử lý dữ liệu của trang này. Chi tiết lỗi đã được ghi nhận trong console của nhà phát triển.
          </p>
          {this.state.error && (
            <div className="mt-4 p-3 bg-muted/60 border border-border/30 rounded-xl text-left max-w-md w-full overflow-auto max-h-[100px]">
              <code className="text-[10px] font-mono text-destructive font-bold break-all leading-tight">
                {this.state.error.toString()}
              </code>
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="h-9 rounded-[8px] border-border text-xs font-bold"
            >
              Tải lại trang
            </Button>
            <Button
              onClick={this.handleReset}
              className="h-9 bg-[#7655aa] hover:bg-[#67489a] text-white rounded-[8px] text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại ngay
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default AdminErrorBoundary;
