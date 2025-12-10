import React from 'react';
/**
 * SimpleRouteError
 *
 * Minimal route error fallback used as an `errorElement` for routes.
 * This component intentionally avoids using any react-router hooks
 * (such as useRouteError) to prevent runtime issues in preview environments.
 *
 * It renders a small, accessible UI with a heading, message and a link back to the home page.
 */
const SimpleRouteError: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full bg-card/80 border border-border rounded-lg p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Route Error</h1>
        <p className="text-sm text-muted-foreground mb-6">
          An error occurred while rendering this page.
        </p>
        <a
          href="/"
          className="inline-block px-4 py-2 rounded-md bg-gradient-primary text-white hover:opacity-95 transition"
          aria-label="Go back to home"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
};
export default SimpleRouteError;