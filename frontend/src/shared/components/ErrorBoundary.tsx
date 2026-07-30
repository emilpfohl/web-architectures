import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Unhandled render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center font-body">
          <h1 className="text-2xl font-bold text-foreground">Etwas ist schiefgelaufen</h1>
          <p className="max-w-sm text-on-surface-variant">
            Die Seite konnte nicht geladen werden. Bitte lade die Seite neu.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-primary px-6 py-3 font-medium text-white transition-all hover:opacity-90"
          >
            Seite neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
