-- Fixes a critical gap: patients and patient_audit_log had no tenant column,
-- and their RLS policies allowed any authenticated user to read/write every
-- row regardless of who created it. This introduces providers + profiles and
-- scopes all patient data access to the caller's own provider.

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  brand_colour text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());

alter table public.providers enable row level security;
create policy "read own provider" on public.providers for select to authenticated
  using (id = (select provider_id from public.profiles where id = auth.uid()));

-- New signups get a profile row automatically, with provider_id left null
-- until an admin assigns them to a provider (see instructions after this file).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed one provider and attach any existing users/patients to it so nothing
-- already in the database is orphaned by this migration.
insert into public.providers (name) values ('Demo Provider');

insert into public.profiles (id, provider_id)
select u.id, (select id from public.providers order by created_at limit 1)
from auth.users u
on conflict (id) do update set provider_id = excluded.provider_id;

alter table public.patients add column provider_id uuid references public.providers(id);
update public.patients set provider_id = (select id from public.providers order by created_at limit 1) where provider_id is null;
alter table public.patients alter column provider_id set not null;

alter table public.patient_audit_log add column provider_id uuid references public.providers(id);
update public.patient_audit_log al
  set provider_id = p.provider_id
  from public.patients p
  where al.patient_id = p.id and al.provider_id is null;
alter table public.patient_audit_log alter column provider_id set not null;

-- Replace the "any signed-in user sees everything" policies with provider-scoped ones.
drop policy "auth read patients" on public.patients;
drop policy "auth insert patients" on public.patients;
drop policy "auth update patients" on public.patients;
drop policy "auth delete patients" on public.patients;

create policy "provider read patients" on public.patients for select to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()));
create policy "provider insert patients" on public.patients for insert to authenticated
  with check (
    provider_id = (select provider_id from public.profiles where id = auth.uid())
    and created_by = auth.uid()
  );
create policy "provider update patients" on public.patients for update to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()))
  with check (provider_id = (select provider_id from public.profiles where id = auth.uid()));
create policy "provider delete patients" on public.patients for delete to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()));

drop policy "auth read audit" on public.patient_audit_log;
drop policy "auth insert audit" on public.patient_audit_log;

create policy "provider read audit" on public.patient_audit_log for select to authenticated
  using (provider_id = (select provider_id from public.profiles where id = auth.uid()));
create policy "provider insert audit" on public.patient_audit_log for insert to authenticated
  with check (
    provider_id = (select provider_id from public.profiles where id = auth.uid())
    and actor_id = auth.uid()
  );
