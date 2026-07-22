create extension if not exists pgcrypto;

create type public.service_category as enum ('photography', 'music');
create type public.inquiry_status as enum ('new', 'contacted', 'awaiting_response', 'confirmed', 'declined', 'archived');
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.contact_method as enum ('email', 'phone', 'text');

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) > 0),
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) > 0),
  last_name text not null check (char_length(trim(last_name)) > 0),
  email text,
  phone text,
  preferred_contact_method public.contact_method,
  referral_source text,
  general_notes text,
  requires_follow_up boolean not null default false,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_up_date_when_required check (not requires_follow_up or follow_up_date is not null)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category public.service_category not null,
  description text,
  default_duration_minutes integer not null default 60 check (default_duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  requested_date date,
  requested_start_time time,
  requested_end_time time,
  message text,
  location text,
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_time_order check (requested_end_time is null or requested_start_time is null or requested_end_time > requested_start_time)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  category public.service_category not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  status public.booking_status not null default 'pending',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_time_order check (end_at > start_at)
);

create index admin_users_auth_user_id_idx on public.admin_users(auth_user_id);
create index clients_name_idx on public.clients(last_name, first_name);
create index clients_follow_up_idx on public.clients(requires_follow_up, follow_up_date) where requires_follow_up;
create index services_category_active_idx on public.services(category, is_active);
create index inquiries_status_created_idx on public.inquiries(status, created_at desc);
create index inquiries_client_id_idx on public.inquiries(client_id);
create index bookings_start_at_idx on public.bookings(start_at);
create index bookings_status_start_idx on public.bookings(status, start_at);
create index bookings_client_id_idx on public.bookings(client_id);
create index bookings_service_id_idx on public.bookings(service_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger admin_users_updated_at before update on public.admin_users for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger inquiries_updated_at before update on public.inquiries for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where auth_user_id = auth.uid()); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.inquiries enable row level security;
alter table public.bookings enable row level security;

create policy "Admins manage admin users" on public.admin_users for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage clients" on public.clients for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage services" on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage inquiries" on public.inquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage bookings" on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.services (name, slug, category, description, default_duration_minutes) values
('Graduation Photography','graduation-photography','photography','Graduation portraits and ceremony coverage.',90),
('Portrait Session','portrait-session','photography','Individual, couple, or family portrait session.',60),
('Branding and Headshots','branding-and-headshots','photography','Professional portraits and brand imagery.',90),
('Church Event Photography','church-event-photography','photography','Photography coverage for church events and services.',180),
('Recording Session','recording-session','music','Vocal or instrumental recording session.',120),
('Mixing','mixing','music','Professional mix preparation and delivery.',180),
('Mastering','mastering','music','Final mastering for release-ready music.',90),
('Full Song Production','full-song-production','music','End-to-end creative and technical song production.',240),
('Worship Playback Editing','worship-playback-editing','music','Custom playback and arrangement editing for worship teams.',120)
on conflict (slug) do nothing;
