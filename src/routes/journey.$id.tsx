import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { getJourney, journeyProgress, type Appointment, type FAQ, type Resource, type Stage, type Task, type Journey } from "@/lib/journeys";

export const Route = createFileRoute("/journey/$id")({
  loader: ({ params }): { journey: Journey } => {
    const journey = getJourney(params.id);
    if (!journey) throw notFound();
    return { journey };
  },
  component: JourneyView,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <p className="text-muted-foreground">Journey not found.</p>
        <Link to="/" className="mt-2 inline-block text-primary underline">Back home</Link>
      </div>
    </div>
  ),
});

function JourneyView() {
  const { journey } = Route.useLoaderData();
  const current = journey.stages[journey.currentStageIndex];
  const progress = journeyProgress(journey);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          All journeys
        </Link>

        <header className="mt-6">
          <p className="text-sm text-muted-foreground">{journey.provider}</p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">{journey.title}</h1>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Where you are" value={`Stage ${journey.currentStageIndex + 1} of ${journey.stages.length}`} sub={current.name} />
            <StatCard label="What's next" value={journey.nextLine} sub={journey.waitEstimate ? `Estimated: ${journey.waitEstimate}` : undefined} />
            <StatCard label="Overall progress" value={`${progress}%`} bar={progress} />
          </div>
        </header>

        {journey.messages.length > 0 && (
          <section className="mt-8 space-y-3">
            {journey.messages.map((m) => (
              <div key={m.id} className="flex gap-3 rounded-2xl border border-info/30 bg-info/5 p-4">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-info/15 text-info">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 8v5M12 17h.01" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl">Do you need to do anything?</h2>
          <div className="mt-4">
            <TasksBlock tasks={current.tasks ?? []} />
          </div>
        </section>

        {journey.appointments.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Appointments</h2>
            <div className="mt-4 space-y-4">
              {journey.appointments.map((a) => <AppointmentCard key={a.id} a={a} />)}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-display text-2xl">Your journey</h2>
          <div className="mt-5 soft-card p-6">
            <StageTrack journey={journey} />
          </div>
        </section>

        {current.resources && current.resources.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Helpful resources</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {current.resources.map((r) => <ResourceCard key={r.id} r={r} />)}
            </div>
          </section>
        )}

        {current.faqs && current.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Common questions</h2>
            <div className="mt-4 soft-card divide-y divide-border">
              {current.faqs.map((f, i) => <FAQItem key={i} faq={f} />)}
            </div>
          </section>
        )}

        {journey.timeline.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Recent activity</h2>
            <ol className="mt-4 space-y-3">
              {[...journey.timeline].reverse().map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-primary/60" />
                  <p className="flex-1 text-sm">{e.label}</p>
                  <p className="text-xs text-muted-foreground">{e.date}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, bar }: { label: string; value: string; sub?: string; bar?: number }) {
  return (
    <div className="soft-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-medium leading-snug">{value}</p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      {typeof bar === "number" && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}

function TasksBlock({ tasks }: { tasks: Task[] }) {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.done])),
  );
  if (tasks.length === 0) {
    return (
      <div className="soft-card p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage text-sage-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
        </div>
        <p className="mt-3 font-display text-xl">Nothing required right now</p>
        <p className="mt-1 text-sm text-muted-foreground">We'll let you know when it's your turn.</p>
      </div>
    );
  }
  const done = Object.values(state).filter(Boolean).length;
  return (
    <div className="soft-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <p className="text-sm font-medium">{done} of {tasks.length} complete</p>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(done / tasks.length) * 100}%` }} />
        </div>
      </div>
      <ul>
        {tasks.map((t) => {
          const checked = state[t.id];
          return (
            <li key={t.id}>
              <button
                onClick={() => setState((s) => ({ ...s, [t.id]: !s[t.id] }))}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-muted/50"
              >
                <span className={`grid h-6 w-6 place-items-center rounded-md border transition ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                  {checked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
                </span>
                <span className={`flex-1 text-sm ${checked ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
                {!checked && <span className="text-xs font-medium text-primary">Start</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AppointmentCard({ a }: { a: Appointment }) {
  return (
    <div className="soft-card overflow-hidden">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 sm:w-32 sm:border-r sm:border-border sm:pr-6">
          <p className="font-display text-3xl leading-none">{a.date.split(" ")[1]}</p>
          <div>
            <p className="text-sm font-medium">{a.date.split(" ")[0]} {a.date.split(" ")[2] ?? ""}</p>
            <p className="text-sm text-muted-foreground">{a.time}</p>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ModeBadge mode={a.mode} />
          </div>
          <h3 className="mt-2 font-display text-xl">{a.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{a.location}</p>

          {a.preparation && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">How to prepare</p>
              <ul className="mt-2 space-y-1.5">
                {a.preparation.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {a.bring && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bring with you</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {a.bring.map((b) => (
                  <span key={b} className="rounded-full bg-muted px-3 py-1 text-xs">{b}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: Appointment["mode"] }) {
  const styles = mode === "Virtual" ? "bg-info/15 text-info" : mode === "Phone" ? "bg-accent text-accent-foreground" : "bg-sage text-sage-foreground";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{mode}</span>;
}

function StageTrack({ journey }: { journey: Journey }) {
  return (
    <ol className="space-y-0">
      {journey.stages.map((s, i) => (
        <StageRow key={s.id} stage={s} isLast={i === journey.stages.length - 1} />
      ))}
    </ol>
  );
}

function StageRow({ stage, isLast }: { stage: Stage; isLast: boolean }) {
  const [open, setOpen] = useState(stage.status === "current");
  const dot =
    stage.status === "complete" ? "bg-primary border-primary text-primary-foreground" :
    stage.status === "current" ? "bg-background border-primary ring-4 ring-primary/15" :
    "bg-background border-border";

  return (
    <li className="relative">
      {!isLast && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />}
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-4 py-3 text-left">
        <span className={`relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${dot}`}>
          {stage.status === "complete" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          )}
          {stage.status === "current" && <span className="h-2 w-2 rounded-full bg-primary" />}
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium">{stage.name}</span>
            {stage.status === "current" && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">Now</span>}
          </span>
          {stage.estimatedDuration && <span className="mt-0.5 block text-xs text-muted-foreground">{stage.estimatedDuration}</span>}
        </span>
      </button>
      {open && (
        <div className="ml-12 pb-4 text-sm text-muted-foreground">
          <p>{stage.description}</p>
          {stage.providerDoing && <p className="mt-2"><span className="text-foreground">We're doing: </span>{stage.providerDoing}</p>}
          {stage.patientDoing && <p className="mt-1"><span className="text-foreground">You're doing: </span>{stage.patientDoing}</p>}
          {stage.nextStep && <p className="mt-1"><span className="text-foreground">Next: </span>{stage.nextStep}</p>}
        </div>
      )}
    </li>
  );
}

function ResourceCard({ r }: { r: Resource }) {
  return (
    <a href={r.url ?? "#"} className="group flex gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mist text-ink">
        <ResIcon type={r.type} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.type}</p>
        <p className="text-sm font-medium">{r.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      </div>
    </a>
  );
}

function ResIcon({ type }: { type: Resource["type"] }) {
  const c = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "Video") return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M10 9l5 3-5 3z" /></svg>;
  if (type === "PDF" || type === "Leaflet") return <svg {...c}><path d="M14 3H6v18h12V7l-4-4z" /><path d="M14 3v4h4" /></svg>;
  if (type === "Support") return <svg {...c}><path d="M20 12a8 8 0 10-16 0 8 8 0 0016 0z" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>;
  return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" /></svg>;
}

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-sm font-medium">{faq.q}</span>
        <svg className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.a}</p>}
    </div>
  );
}
