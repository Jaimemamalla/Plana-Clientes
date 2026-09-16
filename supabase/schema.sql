-- Portal de clientes de Plana: esquema y reglas de acceso.
--
-- Se ejecuta una vez, entero, en Supabase → SQL Editor.
--
-- La seguridad NO está en la web: la clave "anon" que lleva portal/js/config.js
-- es pública por diseño. Lo que impide que una empresa lea datos de otra son
-- las políticas RLS de este archivo. Si alguna tabla nueva se crea sin
-- "enable row level security", queda abierta a cualquiera con la clave.
--
-- Los clientes solo LEEN. Todo lo escribe el equipo de Plana desde el panel de
-- Supabase, que usa la service role y se salta RLS. La única escritura del
-- cliente es valorar a un finalista, y pasa por una función que comprueba que
-- el finalista es de su empresa.

create extension if not exists pgcrypto;

-- ============ TABLAS ============

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cif text,
  sector text,
  -- Tramo de la Escala Plana: 0, 10 o 20 según vacantes al año.
  tramo_descuento smallint not null default 0 check (tramo_descuento in (0, 10, 20)),
  plana_ilimitada boolean not null default false,
  consultor_nombre text,
  consultor_email text,
  consultor_telefono text,
  creado_en timestamptz not null default now()
);

-- Un usuario de Supabase Auth pertenece a una sola empresa. Una empresa puede
-- tener varios usuarios.
create table public.miembros (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nombre text,
  cargo text,
  creado_en timestamptz not null default now()
);

create table public.vacantes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  titulo text not null,
  ubicacion text,
  modalidad text check (modalidad in ('presencial', 'hibrido', 'remoto')),
  salario_min integer,
  salario_max integer,
  pack text not null check (pack in ('Despegue', 'Altitud', 'Estratosfera', 'Plana Ilimitada')),
  fase text not null default 'briefing'
    check (fase in ('briefing', 'busqueda', 'cribado', 'entrevistas', 'shortlist', 'oferta', 'cubierta', 'pausada')),
  abierta_en date not null default current_date,
  shortlist_prevista date,
  prediccion_cierre date,
  cubierta_en date,
  garantia_dias smallint not null default 90 check (garantia_dias in (60, 90, 120)),
  -- Contadores del embudo. Van agregados a propósito: el cliente no tiene por
  -- qué ver a cada persona cribada, solo a los finalistas.
  candidatos_evaluados integer not null default 0,
  entrevistas_realizadas integer not null default 0,
  creado_en timestamptz not null default now()
);

create table public.finalistas (
  id uuid primary key default gen_random_uuid(),
  vacante_id uuid not null references public.vacantes (id) on delete cascade,
  nombre text not null,
  puesto_actual text,
  anos_experiencia smallint,
  pretension_salarial integer,
  encaje smallint check (encaje between 0 and 100),
  resumen text,
  -- Ruta dentro del bucket "documentos": <empresa_id>/<lo que sea>.pdf
  cv_ruta text,
  estado text not null default 'presentado'
    check (estado in ('presentado', 'entrevista', 'oferta', 'contratado', 'descartado')),
  decision_cliente text not null default 'pendiente'
    check (decision_cliente in ('pendiente', 'interesa', 'no_interesa')),
  comentario_cliente text,
  decidido_en timestamptz,
  presentado_en timestamptz not null default now()
);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  vacante_id uuid not null references public.vacantes (id) on delete cascade,
  fecha timestamptz not null default now(),
  titulo text not null,
  detalle text
);

create table public.facturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  vacante_id uuid references public.vacantes (id) on delete set null,
  numero text,
  concepto text not null,
  importe numeric(10, 2) not null,
  emitida_en date not null default current_date,
  vence_en date,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagada', 'vencida')),
  pdf_ruta text
);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  vacante_id uuid references public.vacantes (id) on delete set null,
  tipo text not null default 'informe' check (tipo in ('informe', 'contrato', 'otro')),
  titulo text not null,
  ruta text not null,
  creado_en timestamptz not null default now()
);

create index on public.miembros (empresa_id);
create index on public.vacantes (empresa_id);
create index on public.finalistas (vacante_id);
create index on public.eventos (vacante_id, fecha desc);
create index on public.facturas (empresa_id);
create index on public.documentos (empresa_id);

-- ============ QUIÉN ES QUIÉN ============

-- security definer para que las políticas puedan consultar "miembros" sin
-- entrar en recursión con la propia política de "miembros".
create or replace function public.mi_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.miembros where usuario_id = auth.uid()
$$;

revoke all on function public.mi_empresa_id() from public, anon;
grant execute on function public.mi_empresa_id() to authenticated;

-- ============ RLS ============

alter table public.empresas enable row level security;
alter table public.miembros enable row level security;
alter table public.vacantes enable row level security;
alter table public.finalistas enable row level security;
alter table public.eventos enable row level security;
alter table public.facturas enable row level security;
alter table public.documentos enable row level security;

-- Solo políticas de lectura. Sin políticas de insert, update o delete, RLS
-- deniega esas operaciones a los clientes.

create policy "leer mi empresa" on public.empresas
  for select to authenticated
  using (id = public.mi_empresa_id());

create policy "leer mi ficha" on public.miembros
  for select to authenticated
  using (usuario_id = auth.uid());

create policy "leer mis vacantes" on public.vacantes
  for select to authenticated
  using (empresa_id = public.mi_empresa_id());

create policy "leer finalistas de mis vacantes" on public.finalistas
  for select to authenticated
  using (exists (
    select 1 from public.vacantes v
    where v.id = finalistas.vacante_id
      and v.empresa_id = public.mi_empresa_id()
  ));

create policy "leer eventos de mis vacantes" on public.eventos
  for select to authenticated
  using (exists (
    select 1 from public.vacantes v
    where v.id = eventos.vacante_id
      and v.empresa_id = public.mi_empresa_id()
  ));

create policy "leer mis facturas" on public.facturas
  for select to authenticated
  using (empresa_id = public.mi_empresa_id());

create policy "leer mis documentos" on public.documentos
  for select to authenticated
  using (empresa_id = public.mi_empresa_id());

-- Defensa extra: el rol anónimo no necesita tocar ninguna tabla.
revoke all on all tables in schema public from anon;

-- ============ LA ÚNICA ESCRITURA DEL CLIENTE ============

-- Valorar a un finalista. Va por función y no por una política de update
-- porque una política dejaría cambiar cualquier columna de la fila, también
-- el encaje o el estado. Esta solo toca la decisión y el comentario.
create or replace function public.valorar_finalista(
  p_finalista uuid,
  p_decision text,
  p_comentario text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vacante uuid;
  v_nombre text;
begin
  if p_decision not in ('pendiente', 'interesa', 'no_interesa') then
    raise exception 'Decisión no válida';
  end if;

  update public.finalistas f
     set decision_cliente = p_decision,
         comentario_cliente = left(nullif(trim(p_comentario), ''), 2000),
         decidido_en = now()
   where f.id = p_finalista
     and exists (
       select 1 from public.vacantes v
       where v.id = f.vacante_id
         and v.empresa_id = public.mi_empresa_id()
     )
  returning f.vacante_id, f.nombre into v_vacante, v_nombre;

  if v_vacante is null then
    raise exception 'Finalista no encontrado';
  end if;

  if p_decision <> 'pendiente' then
    insert into public.eventos (vacante_id, titulo, detalle)
    values (
      v_vacante,
      case p_decision when 'interesa' then 'Te interesa ' else 'Descartas a ' end || v_nombre,
      'Valoración desde el área de clientes'
    );
  end if;
end;
$$;

revoke all on function public.valorar_finalista(uuid, text, text) from public, anon;
grant execute on function public.valorar_finalista(uuid, text, text) to authenticated;

-- ============ ARCHIVOS: CVS, INFORMES Y FACTURAS ============

-- Bucket privado. Cada archivo va en una carpeta con el id de su empresa:
-- documentos/<empresa_id>/cv-laura.pdf
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy "leer archivos de mi empresa" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.mi_empresa_id()::text
  );
