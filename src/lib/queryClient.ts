/**
 * Shared QueryClient singleton for the application.
 *
 * Export a single instance of QueryClient so that React Query
 * state (cache, queries, mutations) is shared across the entire app
 * and does not get recreated when modules are re-evaluated.
 *
 * This file is intentionally small and typed for use in TypeScript projects.
 */
import { QueryClient } from '@tanstack/react-query';
/**
 * Application-wide QueryClient instance.
 *
 * Default options can be adjusted according to app needs (e.g. staleTime, retry behavior).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep a short staleTime to allow relatively fresh data while avoiding excessive network requests.
      staleTime: 30 * 1000, // 30 seconds
      // Do not refetch automatically on window focus by default; individual queries can opt-in.
      refetchOnWindowFocus: false,
      // Minimal retry to surface failures quickly in this QA-focused app.
      retry: 1,
    },
    mutations: {
      // Do not retry mutations by default; handle retries explicitly when needed.
      retry: false,
    },
  },
});
export default queryClient;