import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SimpleRouteError from '@/components/SimpleRouteError';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { MonitorPage } from '@/pages/MonitorPage';
import { SettingsPage } from '@/pages/SettingsPage';
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <SimpleRouteError />,
  },
  {
    path: "/monitor",
    element: <MonitorPage />,
    errorElement: <SimpleRouteError />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
    errorElement: <SimpleRouteError />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)