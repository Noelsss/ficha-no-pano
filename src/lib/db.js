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

// --- pagamentos ---

function rowToPagamento(r) {
  return {
    etapaNum: numFromDb(r.etapa_num),
    player: r.player,
    pago: r.pago,
    valor: r.valor,
    dataPago: r.data_pago,
    fonte: r.fonte,
  }
}

function pagamentoToRow(p) {
  return {
    etapa_num: String(p.etapaNum),
    player: p.player,
    pago: !!p.pago,
    valor: p.valor ?? null,
    data_pago: p.dataPago ?? null,
    fonte: p.fonte || 'manual',
  }
}

export async function fetchPagamentos() {
  const { data, error } = await supabase.from('pagamentos').select('*')
  if (error) {
    // tabela pode ainda não existir; trata como vazio
    console.warn('Sem tabela pagamentos (ou erro ao ler):', error.message)
    return []
  }
  return (data || []).map(rowToPagamento)
}

export async function upsertPagamento(p) {
  const { error } = await supabase.from('pagamentos').upsert(pagamentoToRow(p))
  if (error) throw error
}

export async function upsertPagamentos(lista) {
  if (!lista.length) return
  const { error } = await supabase.from('pagamentos').upsert(lista.map(pagamentoToRow))
  if (error) throw error
}

// --- solicitações de acesso ---

// O admin recebe todas; quem não é admin recebe só a própria. Quem decide
// é o RLS, não este código.
export async function fetchSolicitacoes() {
  const { data, error } = await supabase
    .from('solicitacoes')
    .select('email, nome, status, created_at')
    .order('created_at', { ascending: true })
  if (error) {
    console.warn('Erro ao ler solicitações:', error.message)
    return []
  }
  return data || []
}

// Registra (ou atualiza o nome de) o pedido da pessoa logada.
export async function pedirAcesso(email, nome) {
  const { error } = await supabase
    .from('solicitacoes')
    .upsert({ email, nome: nome || null, status: 'pendente' }, { onConflict: 'email' })
  if (error) throw error
}

// Aprovar = colocar em `autorizados`. É isso, e só isso, que dá acesso.
export async function aprovarAcesso(email, nome) {
  const { error } = await supabase
    .from('autorizados')
    .upsert({ email, nome: nome || null, admin: false }, { onConflict: 'email' })
  if (error) throw error
  const { error: e2 } = await supabase
    .from('solicitacoes')
    .update({ status: 'aprovado' })
    .eq('email', email)
  if (e2) throw e2
}

export async function recusarAcesso(email) {
  const { error } = await supabase
    .from('solicitacoes')
    .update({ status: 'recusado' })
    .eq('email', email)
  if (error) throw error
}

// Revogar = tirar de `autorizados`. A conta de login continua existindo,
// mas deixa de enxergar qualquer dado.
export async function revogarAcesso(email) {
  const { error } = await supabase.from('autorizados').delete().eq('email', email)
  if (error) throw error
}

export async function fetchAutorizados() {
  const { data, error } = await supabase
    .from('autorizados')
    .select('email, nome, admin')
    .order('nome')
  if (error) {
    console.warn('Erro ao ler autorizados:', error.message)
    return []
  }
  return data || []
}

// --- autorização ---

// Retorna o registro do usuário logado em `autorizados`, ou null se ele não
// estiver liberado. É o RLS que decide: quem não está na lista recebe [].
export async function fetchMe() {
  const { data, error } = await supabase
    .from('autorizados')
    .select('email, nome, admin, pix')
    .limit(1)
  if (error) {
    console.warn('Erro ao checar autorização:', error.message)
    return null
  }
  return data?.[0] || null
}
