import { Link } from "@tanstack/react-router";
import type { Journey } from "@/lib/journeys";
import { journeyProgress } from "@/lib/journeys";

const accents: Record<Journey["accent"], string> = {
  sage: "bg-sage text-sage-foreground",
  clay: "bg-clay text-ink",
  mist: "bg-mist text-ink",
  sand: "bg-sand text-ink",
};

export function JourneyCard({ journey }: { journey: Journey }) {
  const progress = journeyProgress(journey);
  const stageNum = journey.currentStageIndex + 1;

  return (
    <Link
      to="/journey/$id"
      params={{ id: journey.id }}
      className="group block soft-card p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${accents[journey.accent]}`}>
            {journey.condition}
          </div>
          <h3 className="mt-3 font-display text-2xl leading-tight">{journey.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{journey.provider}</p>
        </div>
        <svg className="mt-2 h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Stage {stageNum} of {journey.stages.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-muted/60 px-4 py-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Current status</p>
        <p className="mt-1 text-sm font-medium">{journey.statusLine}</p>
      </div>
    </Link>
  );
}
