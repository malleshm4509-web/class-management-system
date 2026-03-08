import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null; info?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught:", error, info);
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: "#fff7f7", color: "#611a15", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>Unexpected Application Error</h2>
          <p>Something went wrong in this module. The error has been logged to the console.</p>
          <details style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
            <summary>Show error</summary>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            {this.state.info ? "\n\n" + JSON.stringify(this.state.info) : null}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
