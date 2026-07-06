import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { getJourney, type Journey, type Stage, type Task, type Resource, type FAQ } from "@/lib/journeys";
import { getPatientByCode, type PatientRow } from "@/lib/patients.functions";

export const Route = createFileRoute("/p/$code")({
  loader: async ({ params }) => {
    const patient = await getPatientByCode({ data: { code: params.code } });
    if (!patient) throw notFound();
    const journey = getJourney(patient.pathway);
    if (!journey) throw notFound();
    return { patient, journey };
  },
  component: PatientView,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <p className="text-muted-foreground">This link is not valid or has been revoked.</p>
        <Link to="/" className="mt-2 inline-block text-primary underline">Home</Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center">
      <p className="text-muted-foreground text-sm">Something went wrong. Please try again.</p>
    </div>
  ),
});

// Rebuild a journey view whose stages reflect the patient's current stage from DB.
function overlayJourney(journey: Journey, currentStageId: string): Journey {
  const idx = journey.stages.findIndex((s) => s.id === currentStageId);
  const currentIndex = idx >= 0 ? idx : journey.currentStageIndex;
  const stages: Stage[] = journey.stages.map((s, i) => ({
    ...s,
    status: i < currentIndex ? "complete" : i === currentIndex ? "current" : "upcoming",
  }));
  return { ...journey, stages, currentStageIndex: currentIndex };
}

function PatientView() {
  const { patient, journey: baseJourney } = Route.useLoaderData() as {
    patient: PatientRow;
    journey: Journey;
  };
  const journey = overlayJourney(baseJourney, patient.current_stage_id);
  const current = journey.stages[journey.currentStageIndex];
  const total = journey.stages.length;
  const progress = Math.round(((journey.currentStageIndex + 0.5) / total) * 100);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-5 pb-24 pt-8">
        <header className="mt-2">
          <p className="text-sm text-muted-foreground">{journey.provider}</p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">
            Hello, {patient.first_name}.
          </h1>
          <p className="mt-2 text-muted-foreground">Here's where you are with your {journey.title.toLowerCase()}.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Where you are" value={`Stage ${journey.currentStageIndex + 1} of ${total}`} sub={current.name} />
            <StatCard
              label="What's next"
              value={patient.next_action?.trim() ? patient.next_action : journey.nextLine}
              sub={journey.waitEstimate ? `Estimated: ${journey.waitEstimate}` : undefined}
            />
            <StatCard label="Overall progress" value={`${progress}%`} bar={progress} />
          </div>
        </header>

        {patient.next_action?.trim() && (
          <section className="mt-8">
            <div className="flex gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 8v5M12 17h.01" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium">A note from your care team</p>
                <p className="mt-1 text-sm text-muted-foreground">{patient.next_action}</p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl">Do you need to do anything?</h2>
          <div className="mt-4">
            <TasksBlock tasks={current.tasks ?? []} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl">Your journey</h2>
          <div className="mt-5 soft-card p-6">
            <ol className="space-y-0">
              {journey.stages.map((s, i) => (
                <StageRow key={s.id} stage={s} isLast={i === journey.stages.length - 1} />
              ))}
            </ol>
          </div>
        </section>

        {current.resources && current.resources.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Helpful resources</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {current.resources.map((r: Resource) => <ResourceCard key={r.id} r={r} />)}
            </div>
          </section>
        )}

        {current.faqs && current.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Common questions</h2>
            <div className="mt-4 soft-card divide-y divide-border">
              {current.faqs.map((f: FAQ, i: number) => <FAQItem key={i} faq={f} />)}
            </div>
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
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /></svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.type}</p>
        <p className="text-sm font-medium">{r.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      </div>
    </a>
  );
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
