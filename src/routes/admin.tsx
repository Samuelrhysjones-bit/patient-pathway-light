import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getJourney, PATHWAY_CATALOGUE, type PathwayKey } from "@/lib/journeys";
import { useProviderAuth } from "@/lib/useProviderAuth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminPage,
});

// Supabase throws plain PostgrestError objects (not Error instances), so
// `err instanceof Error` misses them and hides the real RLS/constraint reason.
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Something went wrong";
}

export type Patient = {
  id: string;
  first_name: string;
  provider_ref: string;
  provider_id: string;
  access_code: string;
  date_of_birth: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  updated_at: string;
};

export type Enrolment = {
  id: string;
  patient_id: string;
  provider_id: string;
  pathway_key: PathwayKey;
  current_stage_id: string;
  next_action: string | null;
  updated_at: string;
};

type ProviderPathwayRow = {
  pathway_key: PathwayKey;
};

type AuditRow = {
  id: string;
  patient_id: string;
  enrolment_id: string | null;
  actor_email: string | null;
  from_stage: string | null;
  to_stage: string;
  created_at: string;
};

export function pathwayLabel(key: PathwayKey): string {
  return PATHWAY_CATALOGUE.find((p) => p.key === key)?.label ?? key;
}

function stageLabel(pathwayKey: PathwayKey, stageId: string): string {
  return getJourney(pathwayKey)?.stages.find((s) => s.id === stageId)?.name ?? stageId;
}

function AdminPage() {
  const { loading: authLoading, userEmail, providerId, signOut } = useProviderAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [enabledPathways, setEnabledPathways] = useState<PathwayKey[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<PathwayKey | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);

  const load = useCallback(async () => {
    const [{ data: pp }, { data: p }, { data: e }, { data: a }] = await Promise.all([
      supabase.from("provider_pathways").select("pathway_key"),
      supabase.from("patients").select("*").order("created_at", { ascending: false }),
      supabase.from("patient_pathway_enrolments").select("*"),
      supabase.from("patient_audit_log").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    const pathways = ((pp as ProviderPathwayRow[] | null) ?? []).map((row) => row.pathway_key);
    setEnabledPathways(pathways);
    setSelectedPathway((current) => (current && pathways.includes(current) ? current : (pathways[0] ?? null)));
    setPatients((p as Patient[] | null) ?? []);
    setEnrolments((e as Enrolment[] | null) ?? []);
    setAudit((a as AuditRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    if (!providerId) return;
    (async () => {
      await load();
      setDataLoading(false);
    })();
  }, [providerId, load]);

  if (authLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">Loading…</div>;
  }

  if (!providerId) {
    return (
      <div className="min-h-screen grid place-items-center px-5 text-center">
        <div>
          <p className="font-display text-2xl">Your account isn't linked to a provider yet</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            An existing admin needs to assign your account to a provider before you can see or add patients.
          </p>
          <button onClick={signOut} className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">Sign out</button>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">Loading…</div>;
  }

  const journey = selectedPathway ? getJourney(selectedPathway) : undefined;
  const stageOptions = journey ? journey.stages.map((s) => ({ id: s.id, name: s.name })) : [];
  const pathwayEnrolments = selectedPathway ? enrolments.filter((e) => e.pathway_key === selectedPathway) : [];
  const availableToAdd = PATHWAY_CATALOGUE.filter((p) => !enabledPathways.includes(p.key));

  async function enablePathway(key: PathwayKey) {
    await supabase.from("provider_pathways").insert({ provider_id: providerId, pathway_key: key });
    setSelectedPathway(key);
    await load();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12c4 0 4-6 8-6s4 12 8 12" />
              </svg>
            </div>
            <span className="font-display text-xl">Pathway <span className="text-muted-foreground text-sm">/ admin</span></span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{userEmail}</span>
            <button onClick={signOut} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
        <section className="mb-6">
          <p className="text-sm text-muted-foreground">Provider console</p>
          <h1 className="mt-1 font-display text-4xl">Patients</h1>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          {enabledPathways.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedPathway(key)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                selectedPathway === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {pathwayLabel(key)}{" "}
              <span className="opacity-70">({enrolments.filter((e) => e.pathway_key === key).length})</span>
            </button>
          ))}
          {availableToAdd.length > 0 && <AddPathwayMenu options={availableToAdd} onAdd={enablePathway} />}
        </div>

        {!selectedPathway ? (
          <div className="mt-8 soft-card p-6 text-sm text-muted-foreground">
            No pathways enabled yet — add one above to get started.
          </div>
        ) : (
          <>
            <section className="mt-6">
              <AddPatientForm
                pathwayKey={selectedPathway}
                pathwayLabel={pathwayLabel(selectedPathway)}
                defaultStage={stageOptions[0].id}
                providerId={providerId}
                onAdded={load}
              />
            </section>

            <section className="mt-10">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-2xl">{pathwayLabel(selectedPathway)}</h2>
                <span className="text-sm text-muted-foreground">{pathwayEnrolments.length}</span>
              </div>
              {pathwayEnrolments.length === 0 ? (
                <div className="soft-card p-6 text-sm text-muted-foreground">No patients yet — add your first above.</div>
              ) : (
                <div className="space-y-3">
                  {pathwayEnrolments.map((enrolment) => {
                    const patient = patients.find((p) => p.id === enrolment.patient_id);
                    if (!patient) return null;
                    return (
                      <EnrolmentRow
                        key={enrolment.id}
                        patient={patient}
                        enrolment={enrolment}
                        stageOptions={stageOptions}
                        onChanged={load}
                        userEmail={userEmail}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <section className="mt-14">
          <h2 className="font-display text-2xl">Audit log</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every stage change is recorded, across all pathways.</p>
          <div className="mt-4 soft-card divide-y divide-border">
            {audit.length === 0 && <div className="p-5 text-sm text-muted-foreground">No changes yet.</div>}
            {audit.map((a) => {
              const patient = patients.find((p) => p.id === a.patient_id);
              const enrolment = enrolments.find((e) => e.id === a.enrolment_id);
              const pathwayKey = enrolment?.pathway_key;
              const fromName = pathwayKey && a.from_stage ? stageLabel(pathwayKey, a.from_stage) : (a.from_stage ?? "—");
              const toName = pathwayKey ? stageLabel(pathwayKey, a.to_stage) : a.to_stage;
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                  <span className="font-medium">{patient?.first_name ?? "Patient"}</span>
                  {pathwayKey && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {pathwayLabel(pathwayKey)}
                    </span>
                  )}
                  <span className="text-muted-foreground">moved from</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{fromName}</span>
                  <span className="text-muted-foreground">to</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{toName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {a.actor_email ?? "unknown"} · {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function AddPathwayMenu({
  options,
  onAdd,
}: {
  options: { key: PathwayKey; label: string }[];
  onAdd: (key: PathwayKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted"
      >
        + Add another pathway
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => {
                onAdd(o.key);
                setOpen(false);
              }}
              className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPatientForm({
  pathwayKey,
  pathwayLabel,
  defaultStage,
  providerId,
  onAdded,
}: {
  pathwayKey: PathwayKey;
  pathwayLabel: string;
  defaultStage: string;
  providerId: string;
  onAdded: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [providerRef, setProviderRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          first_name: firstName.trim(),
          provider_ref: providerRef.trim(),
          provider_id: providerId,
          created_by: uid,
        })
        .select("id")
        .single();
      if (patientError) throw patientError;

      const { error: enrolmentError } = await supabase.from("patient_pathway_enrolments").insert({
        patient_id: patient.id,
        provider_id: providerId,
        pathway_key: pathwayKey,
        current_stage_id: defaultStage,
      });
      if (enrolmentError) throw enrolmentError;

      setFirstName("");
      setProviderRef("");
      onAdded();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="soft-card p-6">
      <h2 className="font-display text-xl">Add a patient</h2>
      <p className="mt-1 text-sm text-muted-foreground">Assigns them to the {pathwayLabel} pathway.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          required
          placeholder="First name"
          value={firstName}
          maxLength={80}
          onChange={(e) => setFirstName(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          required
          placeholder="Provider reference ID"
          value={providerRef}
          maxLength={80}
          onChange={(e) => setProviderRef(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add patient"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </form>
  );
}

export function EnrolmentRow({
  patient,
  enrolment,
  stageOptions,
  onChanged,
  userEmail,
}: {
  patient: Patient;
  enrolment: Enrolment;
  stageOptions: { id: string; name: string }[];
  onChanged: () => void;
  userEmail: string | null;
}) {
  const [stage, setStage] = useState(enrolment.current_stage_id);
  const [nextAction, setNextAction] = useState(enrolment.next_action ?? "");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/p/${patient.access_code}` : ""),
    [patient.access_code],
  );

  const dirty = stage !== enrolment.current_stage_id || (nextAction || "") !== (enrolment.next_action ?? "");

  async function save() {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const stageChanged = stage !== enrolment.current_stage_id;

      const { error } = await supabase
        .from("patient_pathway_enrolments")
        .update({
          current_stage_id: stage,
          next_action: nextAction.trim() || null,
        })
        .eq("id", enrolment.id);
      if (error) throw error;

      if (stageChanged && uid) {
        await supabase.from("patient_audit_log").insert({
          patient_id: patient.id,
          enrolment_id: enrolment.id,
          provider_id: patient.provider_id,
          actor_id: uid,
          actor_email: userEmail,
          from_stage: enrolment.current_stage_id,
          to_stage: stage,
        });
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function removeFromPathway() {
    if (!confirm(`Remove ${patient.first_name} from this pathway? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await supabase.from("patient_pathway_enrolments").delete().eq("id", enrolment.id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="soft-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/admin/patients/$id" params={{ id: patient.id }} className="font-display text-xl hover:underline">
            {patient.first_name}
          </Link>
          <p className="text-xs text-muted-foreground">
            Ref: {patient.provider_ref} · Updated {new Date(enrolment.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
            title={shareUrl}
          >
            {copied ? "Copied!" : "Copy shareable link"}
          </button>
          <a href={shareUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">
            Open
          </a>
          <button
            onClick={removeFromPathway}
            disabled={busy}
            className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Current stage</span>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {stageOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Next action for patient</span>
          <input
            type="text"
            value={nextAction}
            maxLength={200}
            placeholder="e.g. Complete the AQ10 questionnaire"
            onChange={(e) => setNextAction(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={save}
          disabled={!dirty || busy}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
