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
  supabaseUrl: 'https://aupibmqcaksxkwsprvcv.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGlibXFjYWtzeGt3c3BydmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTYwNjQsImV4cCI6MjA5ODA3MjA2NH0.qjE5SxjRlt5bg0eDmdiMwD58ebC2WBgfD0pyN-RF5Ps',
  minutosInactividad: 30
};
