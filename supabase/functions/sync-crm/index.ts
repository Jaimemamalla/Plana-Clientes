// Sincroniza las vacantes desde el roadmap del CRM (pestaña PIPELINE).
//
// Se ejecuta con una programación (cron), no la llama nadie directamente.
// Ver supabase/integracion-crm.md para qué debe devolver el endpoint del
// CRM y cómo desplegar y programar esta función.
//
// Variables de entorno necesarias (se guardan como secretos de la función,
// nunca en este archivo):
//   CRM_BASE_URL      - ej. https://crm.tesseraservices.com
//   CRM_SYNC_SECRET   - el valor que también comprueba el CRM
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los da Supabase automáticamente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRM_BASE_URL = Deno.env.get('CRM_BASE_URL')!
const CRM_SYNC_SECRET = Deno.env.get('CRM_SYNC_SECRET')!

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

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

interface FilaCrm {
  crm_id: string
  cliente: string
  titulo: string
  fase_actual: string | null
  resultado: string | null
  fecha_inicio: string | null
  fecha_cierre: string | null
  candidatos_conocidos: number | null
  entrevistas_cliente: number | null
}

async function obtenerVacantesDelCrm(): Promise<FilaCrm[]> {
  const res = await fetch(`${CRM_BASE_URL}/api/plana-sync/vacantes`, {
    headers: { Authorization: `Bearer ${CRM_SYNC_SECRET}` }
  })
  if (!res.ok) throw new Error(`/api/plana-sync/vacantes devolvió ${res.status}`)
  return res.json()
}

// Busca la empresa por nombre (sin mayúsculas/espacios de más) y la crea si
// no existe todavía. El resto de campos de una empresa nueva se quedan en
// blanco para que Plana los rellene a mano.
async function resolverEmpresas(nombres: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(nombres.map((n) => n.trim()).filter(Boolean))]
  const mapa = new Map<string, string>()
  if (!unicos.length) return mapa

  const { data: existentes, error: errorLectura } = await sb
    .from('empresas')
    .select('id, nombre')
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
    const filasCrm = await obtenerVacantesDelCrm()
    if (!filasCrm.length) {
      return new Response(JSON.stringify({ vacantes: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const empresaPorNombre = await resolverEmpresas(filasCrm.map((f) => f.cliente))

    const filas = filasCrm.map((f) => ({
      crm_id: f.crm_id,
      empresa_id: empresaPorNombre.get(f.cliente.trim()) ?? null,
      titulo: f.titulo,
      fase: mapearFase(f.fase_actual, f.resultado),
      abierta_en: f.fecha_inicio ?? '',
      cubierta_en: f.resultado === 'Colocada' ? (f.fecha_cierre ?? '') : '',
      candidatos_evaluados: f.candidatos_conocidos ?? 0,
      entrevistas_realizadas: f.entrevistas_cliente ?? 0
    }))

    const sinEmpresa = filas.filter((f) => !f.empresa_id)
    const conEmpresa = filas.filter((f) => f.empresa_id)
    if (sinEmpresa.length) {
      console.warn(`${sinEmpresa.length} vacantes sin poder resolver la empresa, se omiten`)
    }

    const { error } = await sb.rpc('sync_vacantes', { filas: conEmpresa })
    if (error) throw error

    return new Response(
      JSON.stringify({ vacantes: conEmpresa.length, omitidas: sinEmpresa.length }, null, 2),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[sync-crm] Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
