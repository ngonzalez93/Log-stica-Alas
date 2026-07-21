-- ============================================================================
--  Informes Logística · KPI — Alas
--  Tabla "atencion_fabrica" con la estructura REAL del Excel
--  "Base ATC Fabrica Alas.xlsx" (hoja "Base").
--  ----------------------------------------------------------------------------
--  Reemplaza la versión previa de atencion_fabrica (que guardaba minutos ya
--  calculados) por una que guarda los datos crudos por ticket; el dashboard
--  calcula TTA/espera/carga y todas las agregaciones desde estos datos.
--
--  Correr en el SQL Editor. OJO: si ya habías cargado datos en la tabla vieja,
--  este script la reemplaza (drop + create).
-- ============================================================================

drop table if exists public.atencion_fabrica cascade;

create table public.atencion_fabrica (
  id                bigint generated always as identity primary key,
  turno             text,      -- Excel: "Turno"
  fecha             date,      -- Excel: "Fecha_Registro"
  hora_registro     numeric,   -- Excel: "Hora_Registro"      → minutos desde medianoche
  hora_inicio_carga numeric,   -- Excel: "Hora_Inicio_Carga"  → minutos desde medianoche
  hora_entregado    numeric,   -- Excel: "Hora_Entregado"     → minutos desde medianoche
  ruc_cliente       text,      -- Excel: "Ruc_Cliente"
  nom_cliente       text,      -- Excel: "Nom_Cliente"
  estado            text,      -- Excel: "Estado" (Entregado / Pendiente / Anulado)
  row_hash          text,
  created_at        timestamptz not null default now()
);

create unique index if not exists uq_atencion_fabrica_row_hash on public.atencion_fabrica (row_hash);
create index if not exists ix_fabrica_fecha  on public.atencion_fabrica (fecha);
create index if not exists ix_fabrica_estado on public.atencion_fabrica (estado);

alter table public.atencion_fabrica enable row level security;
drop policy if exists "equipo_acceso_total" on public.atencion_fabrica;
create policy "equipo_acceso_total" on public.atencion_fabrica
  for all to authenticated using (true) with check (true);

-- ============================================================================
--  Listo. Importá "Base ATC Fabrica Alas.xlsx" desde el dashboard ATC Fábrica.
-- ============================================================================
