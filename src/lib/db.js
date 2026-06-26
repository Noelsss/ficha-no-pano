import { supabase } from './supabaseClient'

// --- conversões entre a linha do banco e o objeto usado no app ---

// num é texto no banco ('1'..'9' ou 'MF'); no app é número ou 'MF'.
const numFromDb = (n) => (n === 'MF' ? 'MF' : Number(n))

function rowToEtapa(r) {
  return {
    num: numFromDb(r.num),
    data: r.data,
    sede: r.sede || '',
    buyin: r.buyin,
    rebuy: r.rebuy,
    buyins: r.buyins,
    rebuys: r.rebuys,
    total: r.total,
    fundoFT: r.fundo_ft,
    poolEtapa: r.pool_etapa,
    acumulado: r.acumulado,
    prizes: r.prizes || [],
    resultados: r.resultados || [],
    detalhado: r.detalhado,
  }
}

function etapaToRow(e) {
  return {
    num: String(e.num),
    data: e.data,
    sede: e.sede || '',
    buyin: e.buyin,
    rebuy: e.rebuy,
    buyins: e.buyins,
    rebuys: e.rebuys,
    total: e.total,
    fundo_ft: e.fundoFT ?? 0,
    pool_etapa: e.poolEtapa ?? 0,
    acumulado: e.acumulado ?? 0,
    prizes: e.prizes || [],
    resultados: e.resultados || [],
    detalhado: !!e.detalhado,
  }
}

// --- leitura ---

export async function fetchTudo() {
  const [etapasRes, playersRes] = await Promise.all([
    supabase.from('etapas').select('*'),
    supabase.from('players').select('name'),
  ])
  if (etapasRes.error) throw etapasRes.error
  if (playersRes.error) throw playersRes.error

  const etapas = (etapasRes.data || [])
    .map(rowToEtapa)
    .sort((a, b) => {
      const k = (n) => (n === 'MF' ? Infinity : n)
      return k(a.num) - k(b.num)
    })
  const players = (playersRes.data || [])
    .map((p) => p.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return { etapas, players }
}

// --- escrita (exige estar logado como admin; o RLS garante isso) ---

export async function upsertEtapa(etapa) {
  const { error } = await supabase.from('etapas').upsert(etapaToRow(etapa))
  if (error) throw error
}

export async function removeEtapa(num) {
  const { error } = await supabase.from('etapas').delete().eq('num', String(num))
  if (error) throw error
}

export async function upsertPlayer(name) {
  const { error } = await supabase.from('players').upsert({ name })
  if (error) throw error
}

// Popula o banco com os dados iniciais (apenas se estiver vazio).
export async function semear(seedEtapas, seedPlayers) {
  const linhasEtapas = seedEtapas.map(etapaToRow)
  const linhasPlayers = seedPlayers.map((name) => ({ name }))
  const [e1, e2] = await Promise.all([
    supabase.from('etapas').upsert(linhasEtapas),
    supabase.from('players').upsert(linhasPlayers),
  ])
  if (e1.error) throw e1.error
  if (e2.error) throw e2.error
}

// Restaura os dados originais: apaga tudo e regrava o seed.
export async function restaurar(seedEtapas, seedPlayers) {
  await supabase.from('etapas').delete().neq('num', '___')
  await supabase.from('players').delete().neq('name', '___')
  await semear(seedEtapas, seedPlayers)
}
