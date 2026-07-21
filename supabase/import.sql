-- ============================================================================
--  Informes Logística · KPI — Alas
--  Soporte de importación: deduplicación por FILA COMPLETA
--  ----------------------------------------------------------------------------
--  Correr DESPUÉS de schema.sql (y roles.sql).
--    Supabase → SQL Editor → New query → pegar TODO → Run. Idempotente.
--
--  Agrega a cada tabla una columna 'row_hash' (huella de toda la fila) con
--  índice ÚNICO. La importación calcula ese hash y usa "insertar e ignorar
--  duplicados": si una fila idéntica ya existe, se omite (no se duplica).
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
    execute format('alter table public.%I add column if not exists row_hash text;', t);
    execute format('create unique index if not exists uq_%s_row_hash on public.%I (row_hash);', t, t);
  end loop;
end $$;

-- clientes_geo tenía cod_cliente ÚNICO. Para respetar la deduplicación por
-- fila completa (dos filas distintas del mismo cliente se consideran distintas),
-- quitamos esa restricción; el control de duplicados pasa a ser row_hash.
alter table public.clientes_geo drop constraint if exists uq_clientes_cod;

-- ============================================================================
--  Listo. Ya se puede importar desde importar.html con control de duplicados.
-- ============================================================================
