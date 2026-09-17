# Integración con el CRM propio (roadmap)

Objetivo: que las vacantes del roadmap (pestaña PIPELINE) se vean solas en
el área de clientes, sin duplicar el trabajo a mano en el Table Editor de
Supabase.

## Cómo funciona, en una frase

Cada cierto tiempo (por defecto cada 15 minutos), una función en Supabase
llama a un endpoint del CRM, que le devuelve todas las vacantes activas, y
Supabase las guarda o actualiza. El CRM nunca necesita saber nada de
Supabase ni de contraseñas de nadie: solo responde a una petición GET con
una clave secreta.

## Por qué esto y no lo que se había hablado antes

Al revisar el archivo real (`Roadmap.xlsx`, pestaña PIPELINE) resultó que:

- **No hay datos de empresa** en el roadmap — ni CIF, ni sector, ni plan, ni
  consultor asignado. Solo el **nombre del cliente** como texto en cada fila.
- **No hay finalistas ni facturas** en esta hoja.
- **"Tipo de servicio"** (Headhunting / Outsourcing / Otro / Lead) es una
  clasificación operativa interna, no tiene relación con los packs
  comerciales del portal (Despegue / Altitud / Estratosfera / Plana
  Ilimitada).
- Las **fases** del roadmap (`Briefing`, `Sourcing`, `Entrevistas`,
  `Entrevista Cliente`, `Prueba Técnica Cliente`, `2ª Entrevista Cliente`,
  `3ª Entrevista Cliente`, `Oferta`) no coinciden con las del portal, así
  que hay que traducirlas (ver más abajo).

Por eso esta integración, en su primera versión, sincroniza **solo
vacantes**. Si la empresa no existe todavía en Supabase (por su nombre), se
crea automáticamente con ese nombre y el resto de campos en blanco, para que
Plana los rellene luego a mano (CIF, sector, plan, consultor...).

**Pack y garantía son un placeholder** (`Despegue` / `90` días) hasta que se
decida de dónde debe salir ese dato — hoy no está en el roadmap. La
sincronización solo pone ese valor la primera vez que crea una vacante; si
alguien de Plana lo corrige a mano después, no se vuelve a pisar en la
siguiente ronda (está resuelto así en
[migraciones/2026-09-crm-sync.sql](migraciones/2026-09-crm-sync.sql)).

## Qué tiene que construir el CRM

Un único endpoint de solo lectura:

### `GET /api/plana-sync/vacantes`

Protegido con esta cabecera (un valor secreto acordado entre los dos lados,
un texto largo al azar, no una contraseña de persona):

```
Authorization: Bearer EL_SECRETO_QUE_ACORDÉIS
```

Devuelve un array con **todas las vacantes activas** (no hace falta que sea
solo lo cambiado desde la última vez, para la primera versión basta con
mandarlo todo cada vez):

```json
[
  {
    "crm_id": "TSH_028",
    "cliente": "Aydep",
    "titulo": "Técnico electricista",
    "fase_actual": "Sourcing",
    "resultado": null,
    "fecha_inicio": "2026-05-25",
    "fecha_cierre": null,
    "candidatos_conocidos": 16,
    "entrevistas_cliente": 0
  }
]
```

Corresponde 1 a 1 con columnas que ya existen en el roadmap:

| Campo del JSON | Columna del roadmap |
|---|---|
| `crm_id` | ID |
| `cliente` | Cliente |
| `titulo` | Posición / Cargo |
| `fase_actual` | Fase actual |
| `resultado` | Resultado |
| `fecha_inicio` | Fecha inicio |
| `fecha_cierre` | Fecha cierre |
| `candidatos_conocidos` | Candidatos conocidos |
| `entrevistas_cliente` | Entr. cliente |

- `fase_actual` y `resultado`: mandar el texto tal cual aparece en el
  roadmap (ej. `"Sourcing"`, `"Colocada"`). La traducción a las fases del
  portal la hace la función de Supabase, no hace falta tocarla en el CRM.
- Fechas en formato `YYYY-MM-DD`, o `null` si no aplica todavía.

**No se envían** (son de trabajo interno de Plana, no para el cliente):
Responsable, Tipo de servicio, Dificultad, Por qué es difícil, Motivo de no
avance, Depende de, Próximo paso, Alerta, Antigüedad, ni ninguno de los
"días entre etapas".

## Traducción de fases (ya hecha en la función, no requiere nada del CRM)

| Fase / resultado del roadmap | Fase del portal |
|---|---|
| Resultado = "Colocada" | `cubierta` |
| Resultado = "Perdida" / "Cancelada por el cliente" / "Cerrada (histórico)" / "Retirado" | `pausada` |
| Fase actual = "Briefing" | `briefing` |
| Fase actual = "Sourcing" | `busqueda` |
| Fase actual = "Entrevistas" | `cribado` |
| Fase actual = "Entrevista Cliente" / "Prueba Técnica Cliente" / "2ª Entrevista Cliente" / "3ª Entrevista Cliente" | `entrevistas` |
| Fase actual = "Oferta" | `oferta` |

## Qué pasa si falla o hay un error

Si el endpoint del CRM falla o tarda demasiado, esa ronda se salta y se
reintenta en la siguiente — no se borra ni se toca nada de lo que ya había
en Supabase. La sincronización nunca borra vacantes automáticamente aunque
desaparezcan del roadmap.

## La parte de Supabase (ya preparada en este repo)

- [supabase/migraciones/2026-09-crm-sync.sql](migraciones/2026-09-crm-sync.sql)
  añade la columna `crm_id` a `vacantes` y la función `sync_vacantes`, que
  guarda o actualiza sin pisar `pack`/`garantia_dias` una vez creada la
  vacante.
- [supabase/functions/sync-crm/index.ts](functions/sync-crm/index.ts) llama
  al endpoint del CRM, traduce las fases, resuelve o crea la empresa por
  nombre, y llama a `sync_vacantes`.

Antes de activarla hace falta:

1. Ejecutar la migración en el SQL Editor.
2. Decidir el secreto compartido con el CRM y guardarlo como variable de
   entorno de la función (`CRM_SYNC_SECRET`), nunca en el código del repo.
3. Guardar la URL base del CRM como variable de entorno (`CRM_BASE_URL`).
4. Desplegar la función y programarla cada 15 minutos (Supabase → Edge
   Functions → Cron, o `pg_cron` si se prefiere desde SQL).

## Pendiente / fuera de esta primera versión

- **De dónde sale el pack real y la garantía** de cada vacante — hoy es un
  placeholder. Hay que decidirlo y, cuando se sepa, ajustar la función para
  que lo traiga de ahí en vez de un valor fijo.
- **Finalistas y facturas** no están en el roadmap, así que no se
  sincronizan. Si en el futuro viven en otro sitio del CRM, sería una fase
  aparte con su propio endpoint.
- **Vincular quién inicia sesión con qué empresa** sigue siendo manual
  (invitar en Authentication + fila en `miembros`).
- **Datos de empresa** (CIF, sector, plan, consultor) se rellenan a mano la
  primera vez que aparece un cliente nuevo en el roadmap.
