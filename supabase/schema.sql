-- =========================================================
-- TeamFlow database schema
-- Run once in the Supabase SQL Editor on a NEW project.
-- =========================================================

-- ---------- ENUMS ----------
create type public.workspace_role as enum ('admin', 'member');
create type public.task_status   as enum ('backlog', 'todo', 'in_progress', 'review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

-- ---------- TABLES ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         public.workspace_role not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.boards (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  created_at   timestamptz not null default now()
);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  board_id     uuid not null references public.boards(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  description  text,
  status       public.task_status   not null default 'todo',
  priority     public.task_priority not null default 'medium',
  due_date     date,
  tags         text[] not null default '{}',
  assigned_to  uuid references public.profiles(id) on delete set null,
  created_by   uuid not null references public.profiles(id) on delete cascade,
  position     double precision not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 2000),
  created_at  timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index on public.workspace_members (user_id);
create index on public.boards (workspace_id);
create index on public.tasks (board_id, status, position);
create index on public.tasks (assigned_to);
create index on public.comments (task_id);

-- ---------- HELPER FUNCTIONS (SECURITY DEFINER avoids RLS recursion) ----------
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.workspace_members
                 where workspace_id = ws_id and user_id = auth.uid());
$$;

create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.workspace_members
                 where workspace_id = ws_id and user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.board_workspace_id(b_id uuid)
returns uuid language sql security definer stable set search_path = '' as $$
  select workspace_id from public.boards where id = b_id;
$$;

create or replace function public.task_workspace_id(t_id uuid)
returns uuid language sql security definer stable set search_path = '' as $$
  select b.workspace_id from public.tasks t
  join public.boards b on b.id = t.board_id where t.id = t_id;
$$;

create or replace function public.shares_workspace_with(other_user uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members me
    join public.workspace_members them on them.workspace_id = me.workspace_id
    where me.user_id = auth.uid() and them.user_id = other_user
  );
$$;

-- ---------- TRIGGERS ----------
-- New signup → profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- New workspace → creator becomes admin
create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();

-- Keep tasks.updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- Assignee must belong to the board's workspace
create or replace function public.validate_task_assignee()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assigned_to is not null and not exists (
    select 1 from public.workspace_members wm
    join public.boards b on b.workspace_id = wm.workspace_id
    where b.id = new.board_id and wm.user_id = new.assigned_to
  ) then
    raise exception 'Assignee must be a member of this workspace' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tasks_validate_assignee
  before insert or update of assigned_to, board_id on public.tasks
  for each row execute procedure public.validate_task_assignee();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards            enable row level security;
alter table public.tasks             enable row level security;
alter table public.comments          enable row level security;

create policy "profiles_select_self_or_teammate" on public.profiles
  for select to authenticated using (id = auth.uid() or public.shares_workspace_with(id));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "workspaces_select_member" on public.workspaces
  for select to authenticated using (created_by = auth.uid() or public.is_workspace_member(id));
create policy "workspaces_insert_self" on public.workspaces
  for insert to authenticated with check (created_by = auth.uid());
create policy "workspaces_update_admin" on public.workspaces
  for update to authenticated using (public.is_workspace_admin(id));
create policy "workspaces_delete_admin" on public.workspaces
  for delete to authenticated using (public.is_workspace_admin(id));

create policy "members_select_member" on public.workspace_members
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members_insert_admin" on public.workspace_members
  for insert to authenticated with check (public.is_workspace_admin(workspace_id));
create policy "members_update_admin" on public.workspace_members
  for update to authenticated using (public.is_workspace_admin(workspace_id));
create policy "members_delete_admin_or_self" on public.workspace_members
  for delete to authenticated using (public.is_workspace_admin(workspace_id) or user_id = auth.uid());

create policy "boards_select_member" on public.boards
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "boards_insert_member" on public.boards
  for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "boards_update_member" on public.boards
  for update to authenticated using (public.is_workspace_member(workspace_id));
create policy "boards_delete_admin" on public.boards
  for delete to authenticated using (public.is_workspace_admin(workspace_id));

create policy "tasks_select_member" on public.tasks
  for select to authenticated using (public.is_workspace_member(public.board_workspace_id(board_id)));
create policy "tasks_insert_member" on public.tasks
  for insert to authenticated
  with check (created_by = auth.uid() and public.is_workspace_member(public.board_workspace_id(board_id)));
create policy "tasks_update_member" on public.tasks
  for update to authenticated
  using (public.is_workspace_member(public.board_workspace_id(board_id)))
  with check (public.is_workspace_member(public.board_workspace_id(board_id)));
create policy "tasks_delete_member" on public.tasks
  for delete to authenticated using (public.is_workspace_member(public.board_workspace_id(board_id)));

create policy "comments_select_member" on public.comments
  for select to authenticated using (public.is_workspace_member(public.task_workspace_id(task_id)));
create policy "comments_insert_member" on public.comments
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_workspace_member(public.task_workspace_id(task_id)));
create policy "comments_delete_own" on public.comments
  for delete to authenticated using (user_id = auth.uid());

-- ---------- INVITE BY EMAIL (admin only) ----------
create or replace function public.add_workspace_member(
  ws_id uuid, member_email text, member_role public.workspace_role default 'member'
)
returns public.workspace_members
language plpgsql security definer set search_path = '' as $$
declare
  target_id uuid;
  new_row public.workspace_members;
begin
  if not public.is_workspace_admin(ws_id) then
    raise exception 'Only admins can invite members' using errcode = '42501';
  end if;

  select id into target_id from public.profiles
  where lower(email) = lower(trim(member_email));

  if target_id is null then
    raise exception 'No TeamFlow account found for this email. Ask them to sign up first.'
      using errcode = 'P0002';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, target_id, member_role)
  returning * into new_row;
  return new_row;
exception
  when unique_violation then
    raise exception 'This user is already a member of the workspace' using errcode = '23505';
end;
$$;

revoke execute on function public.add_workspace_member(uuid, text, public.workspace_role) from anon;

-- ---------- REALTIME ----------
alter table public.tasks replica identity full;
alter publication supabase_realtime add table public.tasks, public.comments;