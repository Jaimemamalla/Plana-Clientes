# Área de clientes

Panel privado para las empresas clientes: sus vacantes con fase, embudo y
fechas, los finalistas con su CV y una valoración que llega a la consultora,
la garantía de reposición, facturas, informes y su contacto en Plana.

- Web: `portal/` (HTML, CSS y JS estáticos, funciona en GitHub Pages)
- Base de datos, login y archivos: **Supabase**, proyecto común `tessera-crm`
- Esquema y reglas de acceso: **`supabase/esquema.sql` del repo `tesserahc-crm`**
- Datos de prueba: `supabase/demo.sql`

> **Base de datos común con el CRM (septiembre de 2026).** El portal y el CRM
> interno de Tessera comparten base de datos: las vacantes, fases, finalistas
> e historial que el equipo trabaja en el CRM aparecen aquí solos. Por eso
> `supabase/schema.sql` de este repo queda como referencia histórica: el
> esquema vigente está en `tesserahc-crm`. Diferencias que ya contempla el
> portal:
>
> - La fase **cancelada** (además de cubierta y en pausa).
> - El **pack es opcional**: un headhunting a medida no tiene pack ni garantía
>   de reposición, así que no se muestran.
> - El cliente solo ve las vacantes que el equipo marca como **publicadas**.

Mientras `portal/js/config.js` tenga los valores de ejemplo, el portal no se
conecta y ofrece una **demostración con datos ficticios**. Se puede enlazar
directamente con `portal/?demo`.

## Cómo está protegido

La web es pública; los datos no. La protección está en la base de datos:

- **RLS (Row Level Security)** en todas las tablas. Cada usuario solo puede
  leer las filas de su empresa, aunque manipule el navegador o use la API a
  mano. La clave `anon` de `config.js` es pública por diseño.
- **Los clientes solo leen.** La única escritura es valorar a un finalista, y
  va por la función `valorar_finalista`, que comprueba que es de su empresa y
  solo toca la decisión y el comentario.
- **Sin registro abierto.** Las cuentas las crea Plana (ver abajo).
- **Archivos privados.** CVs, facturas e informes van en un bucket privado y
  se abren con enlaces firmados que caducan en 60 segundos.
- **Sesión que se cierra sola** tras 30 minutos sin actividad
  (`minutosInactividad` en `config.js`).
- **CSP** que prohíbe scripts inline y de otros dominios, y todo lo que viene
  de la base de datos se pinta como texto, nunca como HTML.
- Mismo mensaje de error si el email no existe que si la contraseña está mal.

## Ponerlo en marcha

1. **Crear el proyecto** en [supabase.com](https://supabase.com). Región
   **Frankfurt (eu-central-1)**: los datos de candidatos no deben salir de la
   UE.
2. **SQL Editor** → pegar y ejecutar `supabase/schema.sql` entero.
3. **Authentication → Sign In / Providers → Email**:
   - desactivar **Allow new users to sign up** (imprescindible: si no, cualquiera
     podría crearse una cuenta; no vería datos de nadie, pero no debe poder).
   - contraseña mínima 10 caracteres.
4. **Authentication → URL Configuration**:
   - Site URL: `https://jaimemamalla.github.io/Plana-Clientes/portal/`
     (o el dominio definitivo cuando lo haya)
   - Redirect URLs: la misma. Es a donde vuelve el enlace de recuperar
     contraseña.
5. **Project Settings → API** → copiar *Project URL* y la clave *anon public*
   en `portal/js/config.js`. **Nunca la `service_role`.**
6. Subir los cambios. La demostración desaparece sola al estar conectado.

## Dar de alta a un cliente

1. **Authentication → Users → Add user → Send invitation** con su email. Le
   llega un correo para poner contraseña.
2. **Table Editor → empresas** → crear la empresa (o usar la existente).
3. **Table Editor → miembros** → una fila con el `id` del usuario (se copia de
   Authentication → Users) y el `id` de la empresa.

Sin el paso 3 el cliente puede entrar, pero el portal le dice que su usuario no
está asociado a ninguna empresa y no ve nada.

## Día a día

Todo se edita en el **Table Editor** de Supabase:

| Qué | Tabla |
|---|---|
| Abrir vacante, cambiar fase o fechas, actualizar el embudo | `vacantes` |
| Presentar finalistas | `finalistas` |
| Contar lo que va pasando | `eventos` |
| Facturas | `facturas` |
| Informes y contratos | `documentos` |

Los archivos se suben en **Storage → documentos**, dentro de una carpeta con el
`id` de la empresa (`<empresa_id>/cv-laura.pdf`). Esa ruta es la que va en
`cv_ruta`, `pdf_ruta` o `ruta`. Un archivo fuera de la carpeta de su empresa no
lo puede abrir nadie desde el portal.

Cuando un cliente valora a un finalista, se guarda en `finalistas`
(`decision_cliente`, `comentario_cliente`) y se añade un evento.

## Probarlo con datos

Crear un usuario `cliente.prueba@beplana.com` en Authentication → Users y
ejecutar `supabase/demo.sql`. Para borrarlo todo:

```sql
delete from public.empresas where nombre = 'Empresa de Prueba S.L.';
```

## Pendiente antes de usarlo con clientes reales

- **Política de privacidad**: añadir Supabase como encargado del tratamiento
  (y firmar su DPA, que ofrecen en el panel).
- Decidir quién de Plana tiene acceso al panel de Supabase: ese acceso ve los
  datos de todas las empresas.
- Personalizar las plantillas de correo de Supabase (invitación y recuperar
  contraseña) con la marca de Plana; por defecto salen en inglés.
