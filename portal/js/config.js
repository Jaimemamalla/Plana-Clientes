/* Conexión del área de clientes con Supabase.

   Los dos valores salen de Supabase → Project Settings → API.

   La clave "anon" es pública por diseño: va en el navegador de cualquiera que
   abra esta página. Lo que protege los datos son las políticas RLS de
   supabase/schema.sql, no esconder esta clave.

   NUNCA pegar aquí la "service_role": esa se salta todas las políticas y daría
   acceso a los datos de todas las empresas.

   Mientras sigan los valores de ejemplo, el portal no se conecta y ofrece una
   demostración con datos ficticios. */
window.PLANA_PORTAL = {
  supabaseUrl: 'https://bkeublxqdsixzftnsquj.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZXVibHhxZHNpeHpmdG5zcXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDk3NDUsImV4cCI6MjEwNTEyNTc0NX0.utGztSzTsUXzhFYPPFJJ-6VTWZuyqcw_A24PgaNbz3w',
  minutosInactividad: 30
};
