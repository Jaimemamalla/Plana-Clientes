-- CVs de la Comunidad Plana (comunidad/index.html).
--
-- Se ejecuta una vez en Supabase → SQL Editor, en el proyecto "tessera-crm".
--
-- Formspree no acepta adjuntos en el plan gratuito, así que el CV se sube aquí
-- desde el navegador del candidato y a Formspree solo le llega la ruta.
--
-- Cualquiera con la clave "anon" (que es pública) puede SUBIR a este bucket,
-- pero no leer, listar, sobrescribir ni borrar nada: no hay política de
-- select, update ni delete. Los CVs solo los ve el equipo desde el panel,
-- en Storage → candidaturas. El tamaño y el tipo de archivo los limita el
-- propio bucket, no la web.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidaturas',
  'candidaturas',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "candidatos suben su cv" on storage.objects
  for insert to anon
  with check (bucket_id = 'candidaturas');
