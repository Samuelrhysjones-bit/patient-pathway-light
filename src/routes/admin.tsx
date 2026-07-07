import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getJourney } from "@/lib/journeys";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminPage,
});

// Supabase throws plain PostgrestError objects (not Error instances), so
// `err instanceof Error` misses them and hides the real RLS/constraint reason.
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Failed to add";
}

type Patient = {
  id: string;
  first_name: string;
  provider_ref: string;
  provider_id: string;
  pathway: string;
  current_stage_id: string;
  next_action: string | null;
  access_code: string;
  updated_at: string;
};

type AuditRow = {
  id: string;
  patient_id: string;
  actor_email: string | null;
  from_stage: string | null;
  to_stage: string;
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);

  const adhd = getJourney("adhd")!;
  const stageOptions = adhd.stages.map((s) => ({ id: s.id, name: s.name }));

  const load = useCallback(async () => {
    // RLS already scopes these to the caller's provider, but relies on the
    // caller having a profiles.provider_id set — see the unassigned-account
    // guard in the render below.
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("patients").select("*").order("created_at", { ascending: false }),
      supabase.from("patient_audit_log").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setPatients((p as Patient[] | null) ?? []);
    setAudit((a as AuditRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserEmail(data.session.user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("provider_id")
        .eq("id", data.session.user.id)
        .maybeSingle();
      setProviderId(profile?.provider_id ?? null);
      await load();
      setLoading(false);
    })();
  }, [navigate, load]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) {
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
        <section className="mb-8">
          <p className="text-sm text-muted-foreground">Provider console</p>
          <h1 className="mt-1 font-display text-4xl">Patients</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Add a patient, move them through the ADHD pathway, and share a secure link to their journey page.
          </p>
        </section>

        <AddPatientForm defaultStage={stageOptions[0].id} providerId={providerId} onAdded={load} />

        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Active patients</h2>
            <span className="text-sm text-muted-foreground">{patients.length}</span>
          </div>
          {patients.length === 0 ? (
            <div className="soft-card p-6 text-sm text-muted-foreground">No patients yet — add your first above.</div>
          ) : (
            <div className="space-y-3">
              {patients.map((p) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  stageOptions={stageOptions}
                  onChanged={load}
                  userEmail={userEmail}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl">Audit log</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every stage change is recorded.</p>
          <div className="mt-4 soft-card divide-y divide-border">
            {audit.length === 0 && (
              <div className="p-5 text-sm text-muted-foreground">No changes yet.</div>
            )}
            {audit.map((a) => {
              const patient = patients.find((p) => p.id === a.patient_id);
              const fromName = stageOptions.find((s) => s.id === a.from_stage)?.name ?? a.from_stage ?? "—";
              const toName = stageOptions.find((s) => s.id === a.to_stage)?.name ?? a.to_stage;
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                  <span className="font-medium">{patient?.first_name ?? "Patient"}</span>
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

function AddPatientForm({
  defaultStage,
  providerId,
  onAdded,
}: {
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
      const { error } = await supabase.from("patients").insert({
        first_name: firstName.trim(),
        provider_ref: providerRef.trim(),
        pathway: "adhd",
        current_stage_id: defaultStage,
        provider_id: providerId,
        created_by: uid,
      });
      if (error) throw error;
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
      <p className="mt-1 text-sm text-muted-foreground">Assigns them to the ADHD Assessment pathway.</p>
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

function PatientRow({
  patient,
  stageOptions,
  onChanged,
  userEmail,
}: {
  patient: Patient;
  stageOptions: { id: string; name: string }[];
  onChanged: () => void;
  userEmail: string | null;
}) {
  const [stage, setStage] = useState(patient.current_stage_id);
  const [nextAction, setNextAction] = useState(patient.next_action ?? "");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/p/${patient.access_code}` : ""),
    [patient.access_code],
  );

  const dirty = stage !== patient.current_stage_id || (nextAction || "") !== (patient.next_action ?? "");

  async function save() {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const stageChanged = stage !== patient.current_stage_id;

      const { error } = await supabase
        .from("patients")
        .update({
          current_stage_id: stage,
          next_action: nextAction.trim() || null,
        })
        .eq("id", patient.id);
      if (error) throw error;

      if (stageChanged && uid) {
        await supabase.from("patient_audit_log").insert({
          patient_id: patient.id,
          provider_id: patient.provider_id,
          actor_id: uid,
          actor_email: userEmail,
          from_stage: patient.current_stage_id,
          to_stage: stage,
        });
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${patient.first_name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await supabase.from("patients").delete().eq("id", patient.id);
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
          <p className="font-display text-xl">{patient.first_name}</p>
          <p className="text-xs text-muted-foreground">Ref: {patient.provider_ref} · Updated {new Date(patient.updated_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
            title={shareUrl}
          >
            {copied ? "Copied!" : "Copy shareable link"}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Open
          </a>
          <button
            onClick={remove}
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
              <option key={s.id} value={s.id}>{s.name}</option>
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
