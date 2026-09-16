-- Datos de prueba para comprobar el portal conectado a Supabase.
--
-- Antes: crear el usuario en Authentication → Users → Add user, con el email
-- de abajo. Después ejecutar este archivo en SQL Editor.
--
-- Todo es ficticio. Borrar la empresa de prueba borra en cascada sus vacantes,
-- finalistas, eventos, facturas y documentos:
--   delete from public.empresas where nombre = 'Empresa de Prueba S.L.';

do $$
declare
  v_email text := 'cliente.prueba@beplana.com';
  v_usuario uuid;
  v_empresa uuid;
  v_vac1 uuid;
  v_vac2 uuid;
  v_vac3 uuid;
begin
  select id into v_usuario from auth.users where email = v_email;
  if v_usuario is null then
    raise exception 'Primero crea el usuario % en Authentication → Users', v_email;
  end if;

  insert into public.empresas (nombre, cif, sector, tramo_descuento, consultor_nombre, consultor_email, consultor_telefono)
  values ('Empresa de Prueba S.L.', 'B00000000', 'Software', 10, 'Consultora de Plana', 'hello@beplana.com', null)
  returning id into v_empresa;

  insert into public.miembros (usuario_id, empresa_id, nombre, cargo)
  values (v_usuario, v_empresa, 'Cliente de prueba', 'Responsable de personas');

  insert into public.vacantes (empresa_id, titulo, ubicacion, modalidad, salario_min, salario_max, pack, fase, abierta_en, shortlist_prevista, prediccion_cierre, garantia_dias, candidatos_evaluados, entrevistas_realizadas)
  values (v_empresa, 'Desarrollador/a backend', 'Madrid', 'hibrido', 42000, 50000, 'Altitud', 'shortlist', current_date - 19, current_date + 1, current_date + 16, 90, 138, 11)
  returning id into v_vac1;

  insert into public.vacantes (empresa_id, titulo, ubicacion, modalidad, salario_min, salario_max, pack, fase, abierta_en, shortlist_prevista, prediccion_cierre, garantia_dias, candidatos_evaluados, entrevistas_realizadas)
  values (v_empresa, 'Atención al cliente', 'Oviedo', 'presencial', 22000, 25000, 'Despegue', 'cribado', current_date - 6, current_date + 9, current_date + 24, 60, 64, 0)
  returning id into v_vac2;

  insert into public.vacantes (empresa_id, titulo, ubicacion, modalidad, salario_min, salario_max, pack, fase, abierta_en, cubierta_en, garantia_dias, candidatos_evaluados, entrevistas_realizadas)
  values (v_empresa, 'Responsable de marketing', 'Remoto', 'remoto', 45000, 55000, 'Altitud', 'cubierta', current_date - 70, current_date - 31, 90, 212, 14)
  returning id into v_vac3;

  insert into public.finalistas (vacante_id, nombre, puesto_actual, anos_experiencia, pretension_salarial, encaje, resumen, estado)
  values
    (v_vac1, 'Candidata A', 'Backend en una fintech', 6, 48000, 91, 'Perfil de prueba.', 'presentado'),
    (v_vac1, 'Candidato B', 'Desarrollador en consultora', 4, 44000, 84, 'Perfil de prueba.', 'presentado'),
    (v_vac3, 'Candidata C', 'Marketing en e-commerce', 8, 52000, 93, 'Perfil de prueba.', 'contratado');

  insert into public.eventos (vacante_id, fecha, titulo)
  values
    (v_vac1, now() - interval '19 days', 'Vacante abierta'),
    (v_vac1, now() - interval '12 days', 'Cribado con Planax completado'),
    (v_vac1, now() - interval '1 day', 'Dos finalistas presentados'),
    (v_vac2, now() - interval '6 days', 'Vacante abierta'),
    (v_vac3, now() - interval '31 days', 'Contratación cerrada');

  insert into public.facturas (empresa_id, vacante_id, numero, concepto, importe, emitida_en, vence_en, estado)
  values
    (v_empresa, v_vac3, 'PRUEBA-001', 'Pack Altitud · Responsable de marketing', 4410, current_date - 31, current_date - 1, 'pagada'),
    (v_empresa, v_vac1, 'PRUEBA-002', 'Pack Altitud · Desarrollador/a backend (arranque)', 2205, current_date - 19, current_date + 11, 'pendiente');
end $$;
