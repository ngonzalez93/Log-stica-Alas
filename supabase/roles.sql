-- ============================================================================
--  Informes Logística · KPI — Alas
--  Roles, perfiles y usuario superadministrador
--  ----------------------------------------------------------------------------
--  Correr DESPUÉS de schema.sql:
--    Supabase → SQL Editor → New query → pegar TODO → Run.
--  Es idempotente (se puede re-ejecutar).
--
--  Roles:
--    - superadmin : todo + no puede ser borrado/degradado desde el panel.
--    - admin      : ve todos los módulos + panel de administración de usuarios.
--    - operador   : ve solo los módulos que el admin le habilite.
-- ============================================================================

set search_path = public, extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tabla de perfiles (1 a 1 con auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique,
  role            text not null default 'operador'
                    check (role in ('superadmin','admin','operador')),
  allowed_modules text[] not null default '{}',   -- claves de módulos visibles (solo aplica a operador)
  created_at      timestamptz not null default now()
);

-- RLS: cada usuario puede LEER su propio perfil (lo usa la puerta de acceso).
-- Las escrituras se hacen SOLO desde la API serverless con service_role.
alter table public.profiles enable row level security;
drop policy if exists "leer_perfil_propio" on public.profiles;
create policy "leer_perfil_propio" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Sembrar el superadministrador  (usuario: ngonzalez / contraseña: 123456)
--   OJO: cambiá esta contraseña luego desde el panel de administración.
-- ---------------------------------------------------------------------------
do $$
declare
  v_email text := 'ngonzalez@alas.local';   -- usuario "ngonzalez" + dominio interno
  v_user  text := 'ngonzalez';
  v_pass  text := '123456';
  v_uid   uuid;
begin
  select id into v_uid from auth.users where email = v_email;

  if v_uid is null then
    v_uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, crypt(v_pass, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', v_user),
      '', '', '', ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email),
      'email', now(), now(), now()
    );
  end if;

  insert into public.profiles (id, username, role, allowed_modules)
  values (v_uid, v_user, 'superadmin', '{}')
  on conflict (id) do update
    set role = 'superadmin', username = excluded.username;
end $$;

-- ============================================================================
--  Listo. Ya podés entrar con usuario "ngonzalez" y contraseña "123456".
--  Desde el panel de administración creás el resto de usuarios.
-- ============================================================================
