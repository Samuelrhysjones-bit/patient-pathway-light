-- Splits "a patient" from "a patient's progress through one pathway" so the
-- same person can be enrolled in several pathways at once (e.g. a provider
-- running both an ADHD and an Autism assessment pathway).

-- Which catalogue pathways a provider has switched on.
create table public.provider_pathways (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  pathway_key text not null check (pathway_key in ('adhd', 'autism')),
  enabled_at timestamptz not null default now(),
  unique (provider_id, pathway_key)
);
alter table public.provider_pathways enable row level security;
create policy "provider read provider_pathways" on public.provider_pathways for select to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()));
create policy "provider insert provider_pathways" on public.provider_pathways for insert to authenticated
  with check (provider_id = (select provider_id from public.profiles where id = auth.uid()));
create policy "provider delete provider_pathways" on public.provider_pathways for delete to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()));

-- The link between one person and one pathway, with its own stage progress.
create table public.patient_pathway_enrolments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id),
  pathway_key text not null check (pathway_key in ('adhd', 'autism')),
  current_stage_id text not null,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, pathway_key)
);
alter table public.patient_pathway_enrolments enable row level security;
create policy "provider read enrolments" on public.patient_pathway_enrolments for select to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()));
create policy "provider insert enrolments" on public.patient_pathway_enrolments for insert to authenticated
  with check (provider_id = (select provider_id from public.profiles where id = auth.uid()));
create policy "provider update enrolments" on public.patient_pathway_enrolments for update to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()))
  with check (provider_id = (select provider_id from public.profiles where id = auth.uid()));
create policy "provider delete enrolments" on public.patient_pathway_enrolments for delete to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()));

create trigger enrolments_set_updated_at before update on public.patient_pathway_enrolments
  for each row execute function public.set_updated_at();

-- The patient-facing lookup-by-code function needs to read enrolments too.
grant select on public.patient_pathway_enrolments to service_role;

-- Preserve any existing patients' pathway/stage as their first enrolment,
-- and make sure their provider has that pathway switched on, before the
-- old per-patient columns are dropped below.
insert into public.patient_pathway_enrolments (patient_id, provider_id, pathway_key, current_stage_id, next_action)
select id, provider_id, pathway, current_stage_id, next_action from public.patients;

insert into public.provider_pathways (provider_id, pathway_key)
select distinct provider_id, pathway from public.patients
on conflict (provider_id, pathway_key) do nothing;

-- patients becomes person-level: add contact/DOB, drop per-pathway columns
-- (their values now live in patient_pathway_enrolments instead).
alter table public.patients add column date_of_birth date;
alter table public.patients add column contact_email text;
alter table public.patients add column contact_phone text;
alter table public.patients drop column pathway;
alter table public.patients drop column current_stage_id;
alter table public.patients drop column next_action;

-- Audit log now traces a stage change to a specific enrolment.
alter table public.patient_audit_log add column enrolment_id uuid references public.patient_pathway_enrolments(id) on delete cascade;

update public.patient_audit_log al
set enrolment_id = e.id
from public.patient_pathway_enrolments e
where e.patient_id = al.patient_id and al.enrolment_id is null;
