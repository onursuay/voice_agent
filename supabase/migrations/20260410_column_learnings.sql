create table if not exists column_learnings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  header_normalized text not null,
  crm_field text not null,
  created_at timestamptz default now(),
  unique(organization_id, header_normalized)
);

alter table column_learnings enable row level security;

create policy "org members can read learnings"
  on column_learnings for select
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and is_active = true
    )
  );
