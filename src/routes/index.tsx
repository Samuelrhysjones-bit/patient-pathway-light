import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { JourneyCard } from "@/components/JourneyCard";
import { allOpenTasks, journeys } from "@/lib/journeys";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const openTasks = allOpenTasks().slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:pt-14">
        <section className="mb-10">
          <p className="text-sm text-muted-foreground">Your journeys</p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">
            Everything you need, <span className="italic text-primary">in one calm place.</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Three questions, answered every time you visit: where you are, what happens next, and whether anything's on you.
          </p>
        </section>

        {openTasks.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Things to do</h2>
              <span className="text-sm text-muted-foreground">{openTasks.length} open</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {openTasks.map(({ journey, task }) => (
                <Link
                  key={`${journey.id}-${task.id}`}
                  to="/journey/$id"
                  params={{ id: journey.id }}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <TaskIcon kind={task.kind} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{journey.title}</p>
                  </div>
                  <svg className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Active journeys</h2>
            <span className="text-sm text-muted-foreground">{journeys.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {journeys.map((j) => (
              <JourneyCard key={j.id} journey={j} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function TaskIcon({ kind }: { kind?: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "upload":
      return <svg {...common}><path d="M12 3v12M6 9l6-6 6 6M4 21h16" /></svg>;
    case "read":
      return <svg {...common}><path d="M4 4h9a3 3 0 013 3v13M20 4h-3a3 3 0 00-3 3v13M4 4v16h16" /></svg>;
    case "book":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>;
    case "watch":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M10 9l5 3-5 3z" /></svg>;
    default:
      return <svg {...common}><path d="M9 12l2 2 4-4" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg>;
  }
}
