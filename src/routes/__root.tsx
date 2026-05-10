import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cosmos px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gold">404</h1>
        <h2 className="mt-4 font-display text-xl">The prophecy is lost</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page has slipped beyond the veil.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110"
          >
            Return to the chamber
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-cosmos px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-gold">The candle guttered</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
          >
            Relight
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.18 0.05 280)",
            border: "1px solid oklch(0.82 0.16 84 / 0.4)",
            color: "oklch(0.94 0.04 85)",
            fontFamily: "EB Garamond, serif",
          },
        }}
      />
    </QueryClientProvider>
  );
}
