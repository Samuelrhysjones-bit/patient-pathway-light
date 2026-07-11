import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getJourney, PATHWAY_CATALOGUE, type PathwayKey } from "@/lib/journeys";
import {
  EnrolmentRow,
  extractErrorMessage,
  pathwayLabel,
  type Enrolment,
  type Patient,
} from "@/routes/admin";

export const Route = createFileRoute("/admin_/patients/$id")({
  ssr: false,
  component: PatientProfilePage,
});

function PatientProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [enabledPathways, setEnabledPathways] = useState<PathwayKey[]>([]);

  const load = useCallback(async () => {
    const [{ data: p }, { data: e }, { data: pp }] = await Promise.all([
      supabase.from("patients").select("*").eq("id", id).maybeSingle(),
      supabase.from("patient_pathway_enrolments").select("*").eq("patient_id", id),
      supabase.from("provider_pathways").select("pathway_key"),
    ]);
    setPatient((p as Patient | null) ?? null);
    setEnrolments((e as Enrolment[] | null) ?? []);
    setEnabledPathways(((pp as { pathway_key: PathwayKey }[] | null) ?? []).map((row) => row.pathway_key));
  }, [id]);

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
      setAuthLoading(false);
    })();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

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

  if (!patient) {
    return (
      <div className="min-h-screen grid place-items-center px-5 text-center">
        <div>
          <p className="font-display text-2xl">Patient not found</p>
          <Link to="/admin" className="mt-2 inline-block text-sm text-primary underline">Back to patients</Link>
        </div>
      </div>
    );
  }

  const enrolledKeys = enrolments.map((e) => e.pathway_key);
  const availableToEnrol = enabledPathways.filter((key) => !enrolledKeys.includes(key));

  async function enrol(pathwayKey: PathwayKey) {
    const journey = getJourney(pathwayKey);
    if (!journey || !patient) return;
    await supabase.from("patient_pathway_enrolments").insert({
      patient_id: patient.id,
      provider_id: patient.provider_id,
      pathway_key: pathwayKey,
      current_stage_id: journey.stages[0].id,
    });
    await load();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/admin" className="flex items-center gap-2">
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
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          All patients
        </Link>

        <ProfileHeader patient={patient} onSaved={load} />

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Pathways</h2>
            {availableToEnrol.length > 0 && <EnrolMenu options={availableToEnrol} onEnrol={enrol} />}
          </div>

          {enrolments.length === 0 ? (
            <div className="soft-card p-6 text-sm text-muted-foreground">Not enrolled in any pathway yet.</div>
          ) : (
            <div className="space-y-3">
              {enrolments.map((enrolment) => {
                const journey = getJourney(enrolment.pathway_key);
                const stageOptions = journey ? journey.stages.map((s) => ({ id: s.id, name: s.name })) : [];
                return (
                  <div key={enrolment.id}>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {pathwayLabel(enrolment.pathway_key)}
                    </p>
                    <EnrolmentRow
                      patient={patient}
                      enrolment={enrolment}
                      stageOptions={stageOptions}
                      onChanged={load}
                      userEmail={userEmail}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EnrolMenu({ options, onEnrol }: { options: PathwayKey[]; onEnrol: (key: PathwayKey) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted"
      >
        + Enrol in another pathway
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
          {options.map((key) => (
            <button
              key={key}
              onClick={() => {
                onEnrol(key);
                setOpen(false);
              }}
              className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {pathwayLabel(key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileHeader({ patient, onSaved }: { patient: Patient; onSaved: () => void }) {
  const [dateOfBirth, setDateOfBirth] = useState(patient.date_of_birth ?? "");
  const [contactEmail, setContactEmail] = useState(patient.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(patient.contact_phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    dateOfBirth !== (patient.date_of_birth ?? "") ||
    contactEmail !== (patient.contact_email ?? "") ||
    contactPhone !== (patient.contact_phone ?? "");

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          date_of_birth: dateOfBirth || null,
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
        })
        .eq("id", patient.id);
      if (error) throw error;
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 soft-card p-6">
      <p className="text-sm text-muted-foreground">Patient</p>
      <h1 className="mt-1 font-display text-4xl">{patient.first_name}</h1>
      <p className="mt-1 text-xs text-muted-foreground">Ref: {patient.provider_ref}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Date of birth</span>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Contact email</span>
          <input
            type="email"
            value={contactEmail}
            maxLength={200}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Contact phone</span>
          <input
            type="tel"
            value={contactPhone}
            maxLength={40}
            onChange={(e) => setContactPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex justify-end">
        <button
          onClick={save}
          disabled={!dirty || busy}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </section>
  );
}
