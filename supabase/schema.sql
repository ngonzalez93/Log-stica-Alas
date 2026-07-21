-- ============================================================================
--  Informes Logística · KPI — Alas
--  Esquema de base de datos para Supabase (PostgreSQL)
--  ----------------------------------------------------------------------------
--  Cómo usarlo:
--    Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
--  Es idempotente: se puede correr varias veces sin romper nada.
--
--  Seguridad (RLS):
--    Todas las tablas quedan con Row Level Security activo. Solo usuarios
--    AUTENTICADOS (los que entran por el login del equipo) pueden leer/escribir.
--    La anon key por sí sola (sin login) NO puede ver los datos.
--
--  Una tabla por informe. Los comentarios indican a qué columna del Excel
--  corresponde cada campo, para importar los datos sin confusión.
-- ============================================================================

-- ===========================================================================
-- 1) TIEMPOS DE ATENCIÓN  (Tablero_Tiempos_Alas.html)
--    Excel: hoja "Registro" — un renglón por pedido atendido.
-- ===========================================================================
create table if not exists public.tiempos_atencion (
  id                bigint generated always as identity primary key,
  tipo_flujo        text,          -- Excel: "Tipo de flujo" (Compra / Retiro / Ferretería WMS)
  fecha             date,          -- Excel: "Fecha"
  t1_admin_min      numeric,       -- Excel: "T1 Admin. (min)"
  t2_preparacion_min numeric,      -- Excel: "T2 Preparación (min)"
  t3_espera_min     numeric,       -- Excel: "T3 Espera (min)"
  tta_min           numeric,       -- Excel: "TTA (min)"  (tiempo total de atención)
  error_control     boolean,       -- Excel: "Error control" (Sí=true / No=false)
  reclamo           boolean,       -- Excel: "Reclamo"
  dentro_objetivo   boolean,       -- Excel: "Dentro de objetivo"
  anticipado        boolean,       -- Excel: "Anticipado"
  created_at        timestamptz not null default now()
);
create index if not exists ix_tiempos_atencion_fecha on public.tiempos_atencion (fecha);
create index if not exists ix_tiempos_atencion_flujo on public.tiempos_atencion (tipo_flujo);

-- ===========================================================================
-- 2) TIEMPOS DE ENTREGA  (reporte_tiempos_entrega.html)
--    Excel: exportación de pedidos — un renglón por línea; se deduplica por "Entrega".
-- ===========================================================================
create table if not exists public.tiempos_entrega (
  id            bigint generated always as identity primary key,
  entrega       bigint,        -- Excel: "Entrega" (id de la entrega)
  almacen       text,          -- Excel: "Almacén"
  clase_doc     text,          -- Excel: "ClDoc" (clase de documento)
  fecha_carga   date,          -- Excel: "Fecha Carga del pedido"
  fecha_entrega date,          -- Excel: "Fecha Entrega"
  descr_etapa   text,          -- Excel: "Descr. Etapa"
  -- Días de entrega = fecha_entrega - fecha_carga (calculado automáticamente):
  dias_entrega  integer generated always as (fecha_entrega - fecha_carga) stored,
  created_at    timestamptz not null default now()
);
create index if not exists ix_tiempos_entrega_entrega on public.tiempos_entrega (entrega);
create index if not exists ix_tiempos_entrega_fcarga  on public.tiempos_entrega (fecha_carga);
create index if not exists ix_tiempos_entrega_almacen on public.tiempos_entrega (almacen);

-- ===========================================================================
-- 3) GASTOS vs PRESUPUESTO  (informe_gastos_vs_presupuesto.html)
--    Excel: hoja con columna "Grupo de Gastos" — detalle por mes.
-- ===========================================================================
create table if not exists public.gastos_presupuesto (
  id            bigint generated always as identity primary key,
  grupo_gastos  text,          -- Excel: "Grupo de Gastos"
  orden_int     text,          -- Excel: "Orden Int"
  anio          integer default 2026,  -- del encabezado "Gastos - 2026"
  mes           integer,       -- Excel: "MES" (1 a 12)
  gasto         numeric,       -- Excel: "Gastos - 2026"
  presupuesto   numeric,       -- Excel: "Presup - 2026"
  created_at    timestamptz not null default now(),
  constraint ck_gastos_mes check (mes is null or mes between 1 and 12)
);
create index if not exists ix_gastos_mes   on public.gastos_presupuesto (anio, mes);
create index if not exists ix_gastos_grupo on public.gastos_presupuesto (grupo_gastos);

-- ===========================================================================
-- 4) PEDIDOS PENDIENTES  (Informe_Pedidos_Pendientes.html)
--    Un renglón por pedido pendiente de facturación.
-- ===========================================================================
create table if not exists public.pedidos_pendientes (
  id          bigint generated always as identity primary key,
  pedido      text,      -- Nº de pedido
  vendedor    text,
  fecha       date,
  dias        integer,   -- días pendiente
  almacen     text,
  zona_envio  text,      -- "Zona envío"
  etapa       text,
  lineas      integer,   -- cantidad de líneas
  peso_kg     numeric,   -- "Peso (kg)"
  monto       numeric,   -- "Monto (₲)"
  created_at  timestamptz not null default now()
);
create index if not exists ix_pedidos_fecha    on public.pedidos_pendientes (fecha);
create index if not exists ix_pedidos_vendedor on public.pedidos_pendientes (vendedor);
create index if not exists ix_pedidos_almacen  on public.pedidos_pendientes (almacen);

-- ===========================================================================
-- 5) CLIENTES / GEORREFERENCIACIÓN  (Georreferenciacion_Clientes_Alas.html)
--    Un renglón por cliente. cod_cliente es único (permite actualizar por upsert).
-- ===========================================================================
create table if not exists public.clientes_geo (
  id             bigint generated always as identity primary key,
  cod_cliente    text not null,   -- Excel: "Cod_Cliente" (obligatorio)
  nom_cliente    text,            -- Excel: "Nom_Cliente"
  depart_cliente text,            -- Excel: "Depart_Cliente"
  ciudad_cliente text,            -- Excel: "Ciudad_Cliente"
  vend_asignado  text,            -- Excel: "Vend_Asignado"
  latitud        double precision,-- Excel: "Latitud"
  longitud       double precision,-- Excel: "Longitud"
  created_at     timestamptz not null default now(),
  constraint uq_clientes_cod unique (cod_cliente)
);
create index if not exists ix_clientes_depart on public.clientes_geo (depart_cliente);
create index if not exists ix_clientes_vend   on public.clientes_geo (vend_asignado);

-- ===========================================================================
-- 6) ATENCIÓN — FÁBRICA  (Tablero_ATC_Fabrica_Alas.html)
--    Grano por entrega/atención de la operación de fábrica.
-- ===========================================================================
create table if not exists public.atencion_fabrica (
  id              bigint generated always as identity primary key,
  fecha           date,
  estado          text,      -- entregado / pendiente / anulado
  tta_min         numeric,   -- tiempo total de atención
  espera_min      numeric,   -- tiempo de espera
  carga_min       numeric,   -- tiempo de carga/preparación
  objetivo_min    integer,   -- meta en minutos
  dentro_objetivo boolean,
  anticipado      boolean,
  created_at      timestamptz not null default now()
);
create index if not exists ix_fabrica_fecha  on public.atencion_fabrica (fecha);
create index if not exists ix_fabrica_estado on public.atencion_fabrica (estado);

-- ============================================================================
--  ROW LEVEL SECURITY
--  Activa RLS en todas las tablas y crea una política única por tabla:
--  "acceso total solo para usuarios autenticados".
-- ============================================================================
do $$
declare
  t text;
  tablas text[] := array[
    'tiempos_atencion',
    'tiempos_entrega',
    'gastos_presupuesto',
    'pedidos_pendientes',
    'clientes_geo',
    'atencion_fabrica'
  ];
begin
  foreach t in array tablas loop
    -- activar RLS
    execute format('alter table public.%I enable row level security;', t);
    -- borrar la política si ya existía (para poder re-ejecutar el script)
    execute format('drop policy if exists "equipo_acceso_total" on public.%I;', t);
    -- crear la política: solo usuarios autenticados, todas las operaciones
    execute format(
      'create policy "equipo_acceso_total" on public.%I
         for all
         to authenticated
         using (true)
         with check (true);', t);
  end loop;
end $$;

-- ============================================================================
--  Listo. Tablas creadas y protegidas.
--  Para cargar datos rápido: Supabase → Table Editor → (tabla) → Insert →
--  "Import data from CSV" (exportá cada hoja del Excel a CSV y subila).
-- ============================================================================
