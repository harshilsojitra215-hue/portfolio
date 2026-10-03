import { Component, type ReactNode } from "react";

/*
  A live demo should never show a white screen. If the data file is partial, stale or
  missing a field, say so plainly instead of disappearing.
*/
export class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 40, maxWidth: 620, margin: "0 auto", fontFamily: "var(--sans)" }}>
        <h1 style={{ fontSize: 18, marginBottom: 10 }}>This report could not be rendered</h1>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.65 }}>
          The interface reads everything from <code>app/src/data/results.json</code>. If that file is
          missing or out of date, regenerate it:
        </p>
        <pre style={{
          fontFamily: "var(--mono)", fontSize: 12, background: "var(--panel-2)",
          border: "1px solid var(--line)", borderRadius: 8, padding: 14, overflowX: "auto",
        }}>
{`python data/generate_books.py
python analysis/run_all.py`}
        </pre>
        <p style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--mono)", marginTop: 14 }}>
          {this.state.error.message}
        </p>
      </div>
    );
  }
}
