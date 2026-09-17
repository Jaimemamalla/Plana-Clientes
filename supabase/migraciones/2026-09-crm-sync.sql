-- Sincronización de vacantes desde el roadmap del CRM (pestaña PIPELINE).
--
-- El roadmap identifica cada proceso por su ID (ej. "TSH_028"), y a la
-- empresa solo por su nombre (no tiene un id de empresa propio). Por eso:
--   - "vacantes" gana una columna crm_id, para saber qué fila crear o
--     actualizar en cada sincronización.
--   - "empresas" NO gana columna nueva: si el nombre del cliente no existe
--     todavía, se crea una empresa con ese nombre y el resto en blanco.

alter table public.vacantes add column if not exists crm_id text unique;

-- Guarda o actualiza una vacante sincronizada desde el CRM.
--
-- "pack" y "garantia_dias" no vienen del roadmap (ahí no se lleva ese dato
-- todavía), así que se ponen a un valor por defecto SOLO la primera vez que
-- se crea la vacante. En las sincronizaciones siguientes se dejan tal cual
-- estén en Supabase, para que si alguien de Plana los corrige a mano no se
-- vuelvan a pisar en la próxima ronda.
create or replace function public.sync_vacantes(filas jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.vacantes (
    crm_id, empresa_id, titulo, fase, abierta_en, cubierta_en,
    candidatos_evaluados, entrevistas_realizadas,
    pack, garantia_dias
  )
  select
    (f->>'crm_id'),
    (f->>'empresa_id')::uuid,
    (f->>'titulo'),
    (f->>'fase'),
    nullif(f->>'abierta_en', '')::date,
    nullif(f->>'cubierta_en', '')::date,
    coalesce((f->>'candidatos_evaluados')::integer, 0),
    coalesce((f->>'entrevistas_realizadas')::integer, 0),
    'Despegue',  -- placeholder: pendiente de decidir de dónde sale el pack real
    90           -- placeholder: pendiente de decidir de dónde sale la garantía real
  from jsonb_array_elements(filas) as f
  on conflict (crm_id) do update set
    empresa_id = excluded.empresa_id,
    titulo = excluded.titulo,
    fase = excluded.fase,
    abierta_en = excluded.abierta_en,
    cubierta_en = excluded.cubierta_en,
    candidatos_evaluados = excluded.candidatos_evaluados,
    entrevistas_realizadas = excluded.entrevistas_realizadas;
    -- pack y garantia_dias no se actualizan a propósito, ver comentario de
    -- arriba.
end;
$$;

revoke all on function public.sync_vacantes(jsonb) from public, anon, authenticated;
-- Solo la ejecuta la función de sincronización, que usa la clave
-- service_role (esa se salta el "revoke" de arriba, es normal y esperado).
