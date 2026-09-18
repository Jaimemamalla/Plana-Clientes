// Lee las vacantes del roadmap (Excel de SharePoint, pestaña PIPELINE) por
// Microsoft Graph, y las guarda o actualiza en el área de clientes.
//
// Se ejecuta con una programación (cron), no la llama nadie directamente.
// Ver supabase/integracion-crm.md para cómo registrar la aplicación en
// Azure AD y programar esta función.
//
// Variables de entorno necesarias (se guardan como secretos de la función,
// nunca en este archivo):
//   AZURE_TENANT_ID      - id del tenant de Microsoft 365
//   AZURE_CLIENT_ID      - id de la aplicación registrada en Azure AD
//   AZURE_CLIENT_SECRET  - secreto de esa aplicación
//   SHAREPOINT_FILE_URL  - el enlace para compartir el Roadmap.xlsx, tal
//                          cual lo da SharePoint
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los da Supabase automáticamente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const AZURE_TENANT_ID = Deno.env.get('AZURE_TENANT_ID')!
const AZURE_CLIENT_ID = Deno.env.get('AZURE_CLIENT_ID')!
const AZURE_CLIENT_SECRET = Deno.env.get('AZURE_CLIENT_SECRET')!
const SHAREPOINT_FILE_URL = Deno.env.get('SHAREPOINT_FILE_URL')!

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// El rango donde están los encabezados reales y los datos en la pestaña
// PIPELINE (fila 5 en adelante; la fila 4 son solo títulos de sección). Si
// algún día se añaden más columnas después de "Alerta" (columna AJ), hay
// que ampliar este rango.
const HOJA = 'PIPELINE'
const RANGO = 'A5:AO2000'

async function obtenerTokenGraph(): Promise<string> {
  const res = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    })
  })
  if (!res.ok) throw new Error(`No se pudo obtener el token de Microsoft (${res.status}): ${await res.text()}`)
  const datos = await res.json()
  return datos.access_token
}

// Fórmula de Microsoft Graph para convertir un enlace para compartir en el
// "shareId" que acepta /shares/{id}/driveItem.
// https://learn.microsoft.com/graph/api/shares-get
function idDeCompartido(url: string): string {
  const base64 = btoa(url).replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-')
  return 'u!' + base64
}

// El acceso "por enlace" (/shares/.../driveItem) no admite encadenar la API
// de Excel directamente (Graph responde 400 "not supported for AAD
// accounts"). Hay que resolver antes la ubicación real del archivo
// (driveId + itemId) y llamar a la API de Excel sobre esa ubicación.
async function resolverDriveItem(token: string): Promise<{ driveId: string; itemId: string }> {
  const shareId = idDeCompartido(SHAREPOINT_FILE_URL)
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem?$select=id,parentReference`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Graph devolvió ${res.status} al resolver el archivo: ${await res.text()}`)
  const datos = await res.json()
  return { driveId: datos.parentReference.driveId, itemId: datos.id }
}

async function leerFilasDeExcel(token: string): Promise<(string | number | null)[][]> {
  const { driveId, itemId } = await resolverDriveItem(token)
  const url =
    `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}` +
    `/workbook/worksheets('${HOJA}')/range(address='${RANGO}')`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Graph devolvió ${res.status} al leer el Excel: ${await res.text()}`)
  const datos = await res.json()
  return datos.values ?? []
}

function indiceColumnas(cabecera: (string | number | null)[]): Record<string, number> {
  const mapa: Record<string, number> = {}
  cabecera.forEach((c, i) => {
    if (typeof c === 'string' && c.trim()) mapa[c.trim()] = i
  })
  return mapa
}

// Excel guarda las fechas como número de serie (días desde 1899-12-30).
// Graph a veces las da ya como texto y a veces como ese número; se aceptan
// las dos formas.
function aFecha(valor: string | number | null): string {
  if (valor === null || valor === undefined || valor === '') return ''
  if (typeof valor === 'number') {
    const ms = Math.round((valor - 25569) * 86400 * 1000)
    return new Date(ms).toISOString().slice(0, 10)
  }
  const texto = String(valor).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10)
  const intento = new Date(texto)
  return isNaN(intento.getTime()) ? '' : intento.toISOString().slice(0, 10)
}

// Traduce las fases del roadmap a las fases del área de clientes. Si el
// "Resultado" ya dice que el proceso terminó, manda sobre la fase.
const RESULTADOS_CUBIERTA = ['Colocada']
const RESULTADOS_PAUSADA = ['Perdida', 'Cancelada por el cliente', 'Cerrada (histórico)', 'Retirado']
const MAPA_FASES: Record<string, string> = {
  'Briefing': 'briefing',
  'Sourcing': 'busqueda',
  'Entrevistas': 'cribado',
  'Entrevista Cliente': 'entrevistas',
  'Prueba Técnica Cliente': 'entrevistas',
  '2ª Entrevista Cliente': 'entrevistas',
  '3ª Entrevista Cliente': 'entrevistas',
  'Oferta': 'oferta'
}

function mapearFase(faseActual: string | null, resultado: string | null): string {
  if (resultado && RESULTADOS_CUBIERTA.includes(resultado)) return 'cubierta'
  if (resultado && RESULTADOS_PAUSADA.includes(resultado)) return 'pausada'
  return MAPA_FASES[faseActual ?? ''] ?? 'briefing'
}

// Busca la empresa por nombre (sin mayúsculas/espacios de más) y la crea si
// no existe todavía. El resto de campos de una empresa nueva se quedan en
// blanco para que Plana los rellene a mano.
async function resolverEmpresas(nombres: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(nombres.map((n) => n.trim()).filter(Boolean))]
  const mapa = new Map<string, string>()
  if (!unicos.length) return mapa

  const { data: existentes, error: errorLectura } = await sb.from('empresas').select('id, nombre')
  if (errorLectura) throw errorLectura

  const porNombreNormalizado = new Map(
    (existentes ?? []).map((e) => [e.nombre.trim().toLowerCase(), e.id])
  )

  const faltantes: string[] = []
  for (const nombre of unicos) {
    const id = porNombreNormalizado.get(nombre.toLowerCase())
    if (id) mapa.set(nombre, id)
    else faltantes.push(nombre)
  }

  if (faltantes.length) {
    const { data: creadas, error: errorInsercion } = await sb
      .from('empresas')
      .insert(faltantes.map((nombre) => ({ nombre })))
      .select('id, nombre')
    if (errorInsercion) throw errorInsercion
    for (const e of creadas ?? []) mapa.set(e.nombre, e.id)
  }

  return mapa
}

Deno.serve(async () => {
  try {
    const token = await obtenerTokenGraph()
    const filasExcel = await leerFilasDeExcel(token)
    if (!filasExcel.length) {
      return new Response(JSON.stringify({ vacantes: 0, omitidas: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const idx = indiceColumnas(filasExcel[0])
    const columnasNecesarias = ['ID', 'Cliente', 'Posición / Cargo', 'Fase actual', 'Resultado', 'Fecha inicio', 'Fecha cierre', 'Candidatos conocidos', 'Entr. cliente']
    for (const c of columnasNecesarias) {
      if (!(c in idx)) throw new Error(`No se encuentra la columna "${c}" en la fila de encabezados del roadmap`)
    }

    // Filas de datos: se descartan las que no tienen ID (huecos hasta el
    // final del rango, o filas vaciadas pero no borradas).
    const filasDatos = filasExcel
      .slice(1)
      .filter((f) => String(f[idx['ID']] ?? '').trim() !== '')

    const clientes = filasDatos.map((f) => String(f[idx['Cliente']] ?? '').trim())
    const empresaPorNombre = await resolverEmpresas(clientes)

    const filas = filasDatos
      .map((f) => {
        const cliente = String(f[idx['Cliente']] ?? '').trim()
        const crm_id = String(f[idx['ID']] ?? '').trim()
        const empresa_id = empresaPorNombre.get(cliente)
        if (!empresa_id) return null

        const resultado = (f[idx['Resultado']] as string) ?? null
        return {
          crm_id,
          empresa_id,
          titulo: String(f[idx['Posición / Cargo']] ?? ''),
          fase: mapearFase((f[idx['Fase actual']] as string) ?? null, resultado),
          abierta_en: aFecha(f[idx['Fecha inicio']]),
          cubierta_en: resultado === 'Colocada' ? aFecha(f[idx['Fecha cierre']]) : '',
          candidatos_evaluados: Number(f[idx['Candidatos conocidos']] ?? 0) || 0,
          entrevistas_realizadas: Number(f[idx['Entr. cliente']] ?? 0) || 0
        }
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)

    const omitidas = filasDatos.length - filas.length
    if (omitidas > 0) {
      console.warn(`${omitidas} filas omitidas (sin empresa resuelta)`)
    }

    if (filas.length) {
      const { error } = await sb.rpc('sync_vacantes', { filas })
      if (error) throw error
    }

    return new Response(JSON.stringify({ vacantes: filas.length, omitidas }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[sync-crm] Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
