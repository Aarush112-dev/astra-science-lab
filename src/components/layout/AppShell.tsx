import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Atom, BarChart3, BookOpen, Bookmark, FlaskConical, Home, Menu, Orbit, Sparkles, Telescope, X, Accessibility } from "lucide-react";
import { cn } from "@/lib/utils";
import { hydrateLabStore, labStore, useLabStore } from "@/lib/store/lab-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/laboratory", label: "Laboratory", icon: FlaskConical },
  { to: "/astrophysics", label: "Astrophysics", icon: Telescope },
  { to: "/chemistry", label: "Chemistry", icon: Atom },
  { to: "/experiments", label: "Experiments", icon: Orbit },
  { to: "/data", label: "Data", icon: BarChart3 },
  { to: "/astra", label: "AI Scientist", icon: Sparkles },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/saved", label: "Saved Experiments", icon: Bookmark },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const reduceMotion = useLabStore((s) => s.reduceMotion);
  const isLanding = pathname === "/";

  useEffect(() => {
    hydrateLabStore();
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-1 focus:text-primary-foreground">
        Skip to content
      </a>

      {/* Sidebar */}
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <span className="relative flex size-6 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary/30 blur-sm" />
            <Orbit className="relative size-4 text-primary" />
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.25em]">ASTRA LAB</span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-4" />
          </button>
        </div>
        <ul className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <span className={cn("h-4 w-0.5 rounded-full transition-colors", active ? "bg-primary" : "bg-transparent")} aria-hidden />
                  <Icon className="size-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-sidebar-border p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => labStore.setReduceMotion(!reduceMotion)}
                aria-pressed={reduceMotion}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              >
                <Accessibility className="size-4" />
                Reduced motion
                <span className={cn("ml-auto font-mono text-[10px]", reduceMotion ? "text-emerald" : "text-muted-foreground")}>{reduceMotion ? "ON" : "OFF"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Disable animations across the lab</TooltipContent>
          </Tooltip>
          <p className="mt-2 px-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">Offline-capable · v1.0</p>
        </div>
      </nav>

      {open && <div className="fixed inset-0 z-30 bg-background/70 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn("flex h-14 items-center gap-3 border-b px-4 lg:hidden", isLanding && "absolute inset-x-0 top-0 z-20 border-transparent")}>
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md border p-1.5">
            <Menu className="size-4" />
          </button>
          <span className="font-display text-sm font-semibold tracking-[0.25em]">ASTRA LAB</span>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
