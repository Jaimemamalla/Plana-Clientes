-- Plantilla para dar de alta a un cliente real en el área de clientes.
--
-- Antes de ejecutar esto:
-- 1. Invita al usuario desde Supabase → Authentication → Users → Add user →
--    Send invitation, con su email de trabajo real.
-- 2. Rellena los valores marcados con «--> » de este archivo.
-- 3. Pega el bloque entero en SQL Editor y dale a Run.
--
-- Si la empresa va a tener más de una persona con acceso, repite el paso 1
-- para cada persona y añade una fila más de "miembros" al final, cambiando
-- v_email2 / v_usuario2 (hay un ejemplo comentado más abajo).

do $$
declare
  v_email text := 'CONTACTO@EMPRESA-CLIENTE.COM';  --> email que has invitado
  v_usuario uuid;
  v_empresa uuid;
begin
  select id into v_usuario from auth.users where email = v_email;
  if v_usuario is null then
    raise exception 'Primero invita al usuario % desde Authentication → Users', v_email;
  end if;

  insert into public.empresas (
    nombre,               -- --> Razón social o nombre comercial
    cif,                  -- --> CIF/NIF de la empresa
    sector,               -- --> Sector, ej. 'Software', 'Retail'...
    tramo_descuento,      -- --> 0, 10 o 20, según la Escala Plana (deja 0 si no aplica)
    plana_ilimitada,      -- --> true si tiene el plan "Plana Ilimitada", si no false
    consultor_nombre,     -- --> Quién de Plana lleva la cuenta
    consultor_email,      -- --> Su email
    consultor_telefono    -- --> Su teléfono, o null si no quieres darlo
  )
  values (
    'NOMBRE DE LA EMPRESA S.L.',
    'B00000000',
    'SECTOR',
    0,
    false,
    'NOMBRE DEL CONSULTOR/A',
    'consultor@beplana.com',
    null
  )
  returning id into v_empresa;

  insert into public.miembros (usuario_id, empresa_id, nombre, cargo)
  values (
    v_usuario,
    v_empresa,
    'NOMBRE DEL CONTACTO',   -- --> Nombre de la persona invitada
    'CARGO'                  -- --> Su cargo, ej. 'Responsable de personas'
  );

  -- Si hay una segunda persona con acceso en esta misma empresa, invita su
  -- email también desde Authentication y descomenta este bloque:
  --
  -- declare
  --   v_email2 text := 'OTRA-PERSONA@EMPRESA-CLIENTE.COM';
  --   v_usuario2 uuid;
  -- begin
  --   select id into v_usuario2 from auth.users where email = v_email2;
  --   if v_usuario2 is null then
  --     raise exception 'Primero invita al usuario % desde Authentication → Users', v_email2;
  --   end if;
  --   insert into public.miembros (usuario_id, empresa_id, nombre, cargo)
  --   values (v_usuario2, v_empresa, 'NOMBRE', 'CARGO');
  -- end;

  raise notice 'Empresa creada con id: %', v_empresa;
end $$;
