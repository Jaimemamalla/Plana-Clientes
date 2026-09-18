# Conectar el roadmap de Excel (SharePoint) con el área de clientes

Objetivo: que las vacantes del roadmap (Excel de SharePoint, pestaña
PIPELINE) se vean solas en el área de clientes, sin duplicar el trabajo a
mano en el Table Editor de Supabase.

## Cómo funciona, en una frase

Cada 15 minutos, una función de Supabase pide permiso a Microsoft (con las
credenciales de una aplicación registrada en Azure AD), lee directamente el
rango de datos de la pestaña PIPELINE por la API de Microsoft Graph, y
guarda o actualiza las vacantes en Supabase.

No hace falta convertir nada en tabla de Excel ni montar ningún flujo de
Power Automate — Graph puede leer el rango de celdas directamente.

## 1. Registrar la aplicación en Azure AD

En [portal.azure.com](https://portal.azure.com) (con la cuenta de admin del
tenant de `tesseraservices.com`, que es donde vive el SharePoint):

1. **Azure Active Directory → Registros de aplicaciones → Nuevo registro**.
   - Nombre: por ejemplo `Plana - Sync Roadmap`.
   - Tipos de cuenta admitidos: **solo este directorio organizativo**.
   - No hace falta URI de redirección.
2. Una vez creada, apunta dos valores de la página de resumen:
   - **Id. de aplicación (cliente)** → `AZURE_CLIENT_ID`
   - **Id. de directorio (inquilino)** → `AZURE_TENANT_ID`
3. **Certificados y secretos → Nuevo secreto de cliente**. Ponle una
   caducidad (por ejemplo 24 meses) y copia el **valor** en cuanto lo
   genere — solo se muestra una vez. Eso es `AZURE_CLIENT_SECRET`.
4. **Permisos de API → Agregar un permiso → Microsoft Graph → Permisos de
   aplicación** (no "delegados": esto corre sin que nadie tenga la sesión
   abierta) → busca y marca `Sites.Read.All`.
5. Botón **"Conceder consentimiento de administrador para
   tesseraservices.com"**. Hace falta un rol de administrador global para
   este paso.

**Importante sobre el secreto**: caduca en la fecha que elegiste en el
paso 3. Cuando se acerque esa fecha, hay que generar uno nuevo en Azure y
actualizarlo en Supabase, o la sincronización dejará de funcionar sin
avisar de otra forma que con el error en los logs de la función.

## 2. Desplegar la función de Supabase

El código ya está en
[functions/sync-crm/index.ts](functions/sync-crm/index.ts). Se pega en
**Supabase Dashboard → Edge Functions → sync-crm** (crear la función si no
existe con ese nombre), o se despliega con la CLI de Supabase si se
prefiere (`supabase functions deploy sync-crm`).

Hacen falta estos secretos configurados en la función (Dashboard → Edge
Functions → sync-crm → Secrets):

| Secreto | Valor |
|---|---|
| `AZURE_TENANT_ID` | Del paso 1.2 |
| `AZURE_CLIENT_ID` | Del paso 1.2 |
| `AZURE_CLIENT_SECRET` | Del paso 1.3 |
| `SHAREPOINT_FILE_URL` | El enlace para compartir el `Roadmap.xlsx`, el mismo que ya se usó antes |

(`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase
automáticamente, no hay que añadirlos.)

## 3. Programarla cada 15 minutos

**Supabase Dashboard → Edge Functions → sync-crm → Cron** (o desde SQL con
`pg_cron`, si se prefiere), con expresión `*/15 * * * *`.

## Qué hace la función y cómo traduce los datos

Usa estas columnas del roadmap (el resto se ignoran, incluidas las de
trabajo interno como Responsable, Dificultad, Alerta, etc.):

| Columna del roadmap | Uso |
|---|---|
| `ID` | Identifica la vacante entre sincronizaciones (`crm_id`) |
| `Cliente` | Nombre de la empresa — si no existe en Supabase, se crea con ese nombre y el resto en blanco |
| `Posición / Cargo` | Título de la vacante |
| `Fase actual` | Se traduce a la fase del portal (tabla abajo) |
| `Resultado` | Si dice que el proceso terminó, manda sobre la fase |
| `Fecha inicio` | Fecha de apertura |
| `Fecha cierre` | Solo se usa si `Resultado` = "Colocada" |
| `Candidatos conocidos` | Total de perfiles evaluados (embudo) |
| `Entr. cliente` | Entrevistas realizadas (embudo) |

### Traducción de fases

| Fase / resultado del roadmap | Fase del portal |
|---|---|
| Resultado = "Colocada" | `cubierta` |
| Resultado = "Perdida" / "Cancelada por el cliente" / "Cerrada (histórico)" / "Retirado" | `pausada` |
| Fase actual = "Briefing" | `briefing` |
| Fase actual = "Sourcing" | `busqueda` |
| Fase actual = "Entrevistas" | `cribado` |
| Fase actual = "Entrevista Cliente" / "Prueba Técnica Cliente" / "2ª Entrevista Cliente" / "3ª Entrevista Cliente" | `entrevistas` |
| Fase actual = "Oferta" | `oferta` |

**Pack y garantía son un placeholder** (`Despegue` / 90 días) hasta que se
decida de dónde debe salir ese dato — hoy no está en el roadmap. Solo se
ponen la primera vez que se crea una vacante; si alguien de Plana los
corrige a mano después en Supabase, no se vuelven a pisar en la siguiente
sincronización (resuelto en
[migraciones/2026-09-crm-sync.sql](migraciones/2026-09-crm-sync.sql), función
`sync_vacantes`).

## Qué pasa si algo falla

Si la lectura del Excel falla (token caducado, secreto mal puesto, el
rango no encuentra alguna columna esperada...), esa ronda no guarda nada y
se reintenta en la siguiente, cada 15 minutos. La sincronización nunca
borra vacantes automáticamente aunque desaparezcan del roadmap.

Si en el roadmap se añaden columnas nuevas después de "Alerta", hay que
ampliar el rango `A5:AO2000` que usa la función (en la constante `RANGO` de
`index.ts`) para que las siga incluyendo.

## Verificación

- Ejecutar la función manualmente una vez desde el Dashboard de Supabase
  (o con un `curl` a su URL con la clave `anon`) y comprobar en los logs
  que no da error, y en el Table Editor que las vacantes de Aydep quedan
  igual que en la prueba manual anterior.
- Cambiar una celda de una fila en el Excel de SharePoint (por ejemplo,
  `Fase actual` o `Candidatos conocidos`) y comprobar que, en la siguiente
  ronda de 15 minutos, el cambio aparece en el área de clientes.

## Pendiente / fuera de esta versión

- **De dónde sale el pack real y la garantía** de cada vacante — hoy es un
  placeholder.
- **Finalistas y facturas** no están en el roadmap, así que no se
  sincronizan.
- **Vincular quién inicia sesión con qué empresa** sigue siendo manual
  (invitar en Authentication + fila en `miembros`).
- **Datos de empresa** (CIF, sector, plan, consultor) se rellenan a mano la
  primera vez que aparece un cliente nuevo en el roadmap.
- **Renovar el secreto de Azure AD** antes de que caduque (ver aviso en el
  paso 1).
- **Un panel/CRM propio** que sustituya del todo a este Excel (incluyendo
  campos internos como Responsable, Dificultad, Alerta) es una idea para
  más adelante, aparcada por ahora.
