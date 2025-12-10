# Ethical Reload — Controlled Reload & QA Scheduler

Ethical Reload is a legitimate web application designed for Quality Assurance (QA) testing and performance monitoring. It allows users to schedule controlled browser-based reloads and visits to websites for internal testing purposes, ensuring compliance with ethical standards and site terms of service. The app emphasizes user consent, audit trails, and client-side execution to prevent misuse.

[cloudflarebutton]

## Features

- **Ethical Scheduler**: Configure reload intervals, durations, and targets with mandatory consent checkboxes and server-side logging for audit compliance.
- **Client-Side Execution**: Browser-based scheduling respects browser policies and avoids server-side proxying to external sites.
- **Monitor Dashboard**: View active schedules, real-time logs, and activity reports with pause/cancel controls.
- **Safety Controls**: Enforce minimum intervals (≥5s), concurrency limits, and daily caps to prevent abuse.
- **Audit Trail**: Store metadata, consent records, and timestamps in Cloudflare Durable Objects for traceability.
- **Responsive UI**: Beautiful, mobile-first interface built with ShadCN UI and Tailwind CSS for seamless interaction across devices.
- **Integration Ready**: Backend APIs for storing schedules and logs, with mock data for initial development.

This tool is intended for QA teams to simulate user traffic in controlled environments, not for inflating views or violating terms of service.

## Tech Stack

- **Frontend**: React 18, React Router 6, TypeScript, ShadCN UI, Tailwind CSS v3, Framer Motion (animations), Lucide React (icons), TanStack React Query (data fetching), Zustand (state management), Sonner (toasts)
- **Backend**: Cloudflare Workers, Hono (routing), Cloudflare Durable Objects (persistent storage)
- **Utilities**: Zod (validation), UUID (IDs), Recharts (optional charts), Date-fns (date handling)
- **Build Tools**: Vite, Bun (package manager), Wrangler (Cloudflare deployment)
- **Other**: Immer (immutable updates), Class Variance Authority (styling)

## Quick Start

To get started quickly, ensure you have Bun installed and clone the repository. Follow the installation steps below to run the development server.

## Installation

1. **Prerequisites**:
   - Install [Bun](https://bun.sh/) (recommended for this project).
   - Install [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) for Cloudflare deployment: `bunx wrangler@latest install`.

2. **Clone and Setup**:
   ```bash
   git clone <your-repo-url>
   cd ethical-reload
   bun install
   ```

3. **Generate Types** (for Cloudflare Workers):
   ```bash
   bun run cf-typegen
   ```

4. **Run Development Server**:
   ```bash
   bun run dev
   ```
   The app will be available at `http://localhost:3000`. The Cloudflare Worker backend runs alongside for API endpoints.

## Development

### Project Structure
- `src/`: React frontend (pages, components, hooks).
- `worker/`: Cloudflare Worker backend (routes, Durable Object logic).
- `shared/`: Shared types and mock data.
- Use `src/pages/HomePage.tsx` as the entry point and extend routes in `src/main.tsx`.

### Adding Features
- **Frontend Routes**: Edit `src/main.tsx` to add new pages with React Router.
- **API Endpoints**: Implement in `worker/userRoutes.ts` following the Durable Object pattern (e.g., `app.get('/api/schedules', ...)`).
- **Durable Object Methods**: Extend `worker/durableObject.ts` for storage (e.g., `addSchedule`, `getLogs`).
- **Mock Data**: Use `shared/mock-data.ts` for Phase 1 development; replace with real API calls in later phases.
- **Styling**: Leverage ShadCN UI components (import from `@/components/ui/*`) and Tailwind utilities. Ensure responsive design with mobile-first breakpoints.
- **State Management**: Use Zustand for local state; select primitives only (e.g., `useStore(s => s.value)`) to avoid re-render issues.
- **Data Fetching**: Integrate TanStack Query for API calls to `/api/*` endpoints.
- **Linting and TypeScript**: Run `bun run lint` for checks. All code must be TypeScript-compliant.

### Common Development Tasks
- **Build for Production**: `bun run build`.
- **Preview Build**: `bun run preview`.
- **Type Checking**: `bun tsc --noEmit`.
- **Add ShadCN Component**: Use `npx shadcn-ui@latest add <component>` (if needed, though most are pre-installed).

### Environment Variables
No custom env vars are required initially. Cloudflare bindings (e.g., `GlobalDurableObject`) are handled via Wrangler.

## Usage

### Core Workflow
1. **Home Page**: Enter target URL (QA/internal sites only), set interval (min 5s), duration/count, and confirm consent.
2. **Start Schedule**: Client-side scheduler runs in the browser tab; reports back to `/api/reports` after each action.
3. **Monitor Page**: View schedules via `/api/schedules`, logs, and controls (pause/cancel updates DO state).
4. **Settings Page**: Adjust global limits and export audit logs.

### Example API Usage (Frontend)
```tsx
// Fetch schedules
const { data: schedules } = useQuery({
  queryKey: ['schedules'],
  queryFn: () => fetch('/api/schedules').then(res => res.json()),
});

// Create schedule
const createSchedule = async (scheduleData) => {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData),
  });
  return res.json();
};
```

### Client-Side Scheduler Example
The scheduler uses `setInterval` for reloads (client-only):
```tsx
// In a background tab/component
useEffect(() => {
  if (active) {
    const interval = setInterval(() => {
      window.location.reload(); // Or history.replaceState for navigation
      reportToAPI({ scheduleId, timestamp: Date.now(), result: 'success' });
    }, intervalMs);
    return () => clearInterval(interval);
  }
}, [active, intervalMs]);
```

### Safety Notes
- Always validate inputs client-side and server-side (min interval 5000ms).
- Logs are capped (e.g., last 5000 entries) to respect DO limits.
- Consent is logged with hashed IP/user-agent for privacy.

## Deployment

Deploy to Cloudflare Workers for global edge execution. The frontend builds to static assets served via Workers Sites.

1. **Login to Cloudflare**:
   ```bash
   bunx wrangler@latest login
   ```

2. **Configure Account** (if first time):
   ```bash
   bunx wrangler@latest whoami
   ```

3. **Build and Deploy**:
   ```bash
   bun run deploy
   ```
   This builds the frontend and deploys the Worker. Access the app at your Workers subdomain (e.g., `ethical-reload.youraccount.workers.dev`).

4. **Custom Domain** (Optional):
   Edit `wrangler.jsonc` (do not modify bindings) and run `bun run deploy`.

[cloudflarebutton]

### Post-Deployment
- APIs are available at `/api/*` relative to your domain.
- Durable Object persistence is global and automatic.
- Monitor logs via Cloudflare Dashboard > Workers > Your Worker > Logs.

## Contributing

Contributions are welcome! Please:
- Fork the repo and create a feature branch.
- Follow TypeScript and ESLint rules.
- Add tests for new features (though not enforced yet).
- Update README for changes.
- Submit a PR with clear description.

Report issues via GitHub Issues.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details (add if not present). Note: Ethical use required; misuse for view inflation violates terms and is not supported.