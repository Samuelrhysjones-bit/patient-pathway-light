import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12c4 0 4-6 8-6s4 12 8 12" />
            </svg>
          </div>
          <span className="font-display text-xl">Pathway</span>
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Good morning, Sam</span>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-sage text-sage-foreground font-medium">
            S
          </div>
        </div>
      </div>
    </header>
  );
}
