-- Auto-provision a `public.profiles` row for every new auth user.
--
-- Supabase Auth owns `auth.users`; the app keys all domain data off
-- `public.profiles`. Without this trigger a freshly signed-up user has no
-- profile row until something writes one — `getSession()` would return
-- `profile: null`. This closes that gap at the source.
--
-- Idempotent: safe to re-apply (create or replace + drop trigger if exists).

-- `security definer` so the function runs with the owner's rights and can
-- insert into `public.profiles` regardless of the calling role / RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    -- Prefer a display name from sign-up metadata, fall back to the email.
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.email
    )
  )
  -- `role` and `plan` keep their schema defaults ('builder' / 'free').
  -- Defensive: never fail the auth insert if the row somehow already exists.
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
